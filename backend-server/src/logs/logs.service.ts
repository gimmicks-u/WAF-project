import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, LogAction, LogSource } from './entities/log.entity';
import { LogsQueryDto } from './dto/logs-query.dto';
import { Domain, DomainStatus } from '../domains/entities/domain.entity';

// Type definitions for WAF log processing
interface WafMessageDetails {
  rev: string;
  ver: string;
  data: string;
  file: string;
  tags: string[];
  match: string;
  ruleId: string | number;
  accuracy: string | number;
  maturity: string | number;
  severity: string | number;
  reference: string;
  lineNumber: string | number;
}

interface WafMessage {
  details: WafMessageDetails;
  message: string;
}

interface WafRequest {
  uri?: string;
  method?: string;
  headers?: Record<string, string>;
  http_version?: number | string;
  body?: string | null;
}

interface WafResponse {
  body?: string | null;
  headers?: Record<string, string>;
  http_code?: number;
  status?: number;
}

interface WafTransaction {
  host_ip?: string;
  request?: WafRequest;
  messages?: WafMessage[];
  producer?: unknown;
  response?: WafResponse;
  client_ip?: string;
  host_port?: number;
  server_id?: string;
  unique_id?: string;
  time_stamp?: string;
  client_port?: number;
}

interface WafIngestLog {
  source: 'waf';
  timestamp: string;
  transaction: WafTransaction;
  [key: string]: unknown;
}

interface AccessIngestLog {
  source: 'access';
  timestamp?: string;
  time?: string;
  '@timestamp'?: string;
  status?: number | string | null;
  remote_addr?: string;
  request_method?: string;
  request_uri?: string;
  uri?: string;
  [key: string]: unknown;
}

type IngestLog = WafIngestLog | AccessIngestLog;

interface NormalizedRecord {
  ts: Date;
  source: LogSource;
  action: LogAction;
  ip: string | null;
  method: string | null;
  uri: string | null;
  status: number | null;
  rule_ids: number[] | null;
  request_headers: Record<string, string> | null;
  response_headers: Record<string, string> | null;
  request_body: string | null;
  response_body: string | null;
  raw: unknown;
  user_id: string | null;
}

@Injectable()
export class LogsService {
  private readonly domainCache = new Map<
    string,
    { userId: string | null; expiresAt: number }
  >();
  private readonly DOMAIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
  ) {}

  async ingestLogs(
    body: IngestLog | IngestLog[],
  ): Promise<{ success: boolean }> {
    const records: IngestLog[] = Array.isArray(body) ? body : [body];

    const logsToSave = await Promise.all(
      records.map(async (record) => {
        const normalized = this.normalizeRecord(record);
        // Prefer tenant/user id provided by the log itself (from Nginx/ModSecurity)
        const userIdFromLog = this.extractUserIdFromLogRecord(record);
        if (userIdFromLog) {
          normalized.user_id = userIdFromLog;
        }

        return this.logRepository.create(normalized);
      }),
    );
    await this.logRepository.save(logsToSave);
    return { success: true };
  }

  async getLogs(query: LogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const queryBuilder = this.logRepository.createQueryBuilder('log');

    // Apply filters
    if (query.from) {
      queryBuilder.andWhere('log.ts >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      queryBuilder.andWhere('log.ts <= :to', { to: new Date(query.to) });
    }
    if (query.ip) {
      queryBuilder.andWhere('log.ip = :ip', { ip: query.ip });
    }
    if (query.uri) {
      queryBuilder.andWhere('log.uri ILIKE :uri', { uri: `%${query.uri}%` });
    }
    if (query.method) {
      queryBuilder.andWhere('log.method = :method', {
        method: query.method.toUpperCase(),
      });
    }
    if (query.status !== undefined) {
      queryBuilder.andWhere('log.status = :status', { status: query.status });
    }
    if (query.action) {
      queryBuilder.andWhere('log.action = :action', { action: query.action });
    }
    if (query.source) {
      queryBuilder.andWhere('log.source = :source', { source: query.source });
    }
    if (query.rule_id !== undefined) {
      queryBuilder.andWhere(':rule_id = ANY(log.rule_ids)', {
        rule_id: query.rule_id,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    queryBuilder.orderBy('log.ts', 'DESC').skip(offset).take(limit);

    const items = await queryBuilder.getMany();

    return {
      items,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
    };
  }

  private normalizeRecord(record: IngestLog): NormalizedRecord {
    const source = record.source === 'waf' ? LogSource.WAF : LogSource.ACCESS;

    // Determine timestamp
    let tsInput: string | number = Date.now();
    if (source === LogSource.WAF) {
      tsInput = (record as WafIngestLog).timestamp;
    } else if (source === LogSource.ACCESS) {
      const r = record as AccessIngestLog;
      tsInput = r.timestamp ?? r.time ?? r['@timestamp'] ?? Date.now();
    }

    const normalized: NormalizedRecord = {
      ts: new Date(tsInput),
      source,
      raw: record,
      action: LogAction.UNKNOWN,
      ip: null,
      method: null,
      uri: null,
      status: null,
      rule_ids: null,
      request_headers: null,
      response_headers: null,
      request_body: null,
      response_body: null,
      user_id: null,
    };

    if (source === LogSource.ACCESS) {
      const r = record as AccessIngestLog;
      const statusVal = r.status != null ? Number(r.status) : null;
      normalized.status = Number.isFinite(statusVal as number)
        ? (statusVal as number)
        : null;
      normalized.action =
        normalized.status != null && normalized.status >= 400
          ? LogAction.BLOCKED
          : LogAction.ALLOWED;
      normalized.ip = r.remote_addr ?? null;
      normalized.method = (r.request_method || '').toUpperCase() || null;
      normalized.uri = r.request_uri || r.uri || null;
    } else if (source === LogSource.WAF) {
      const tx = (record as WafIngestLog).transaction || {};
      const req = tx.request || {};
      const res = tx.response || {};

      const status = res.http_code ?? res.status ?? null;
      normalized.status = status ?? null;

      if (status != null && status >= 400) {
        normalized.action = LogAction.BLOCKED;
      } else if (Array.isArray(tx.messages) && tx.messages.length > 0) {
        normalized.action = LogAction.DETECTED;
      } else {
        normalized.action = LogAction.ALLOWED;
      }

      normalized.ip = tx.client_ip ?? null;
      normalized.method =
        req.method || '' ? (req.method as string).toUpperCase() : null;
      normalized.uri = req.uri ?? null;

      // Collect rule IDs as numbers
      if (Array.isArray(tx.messages)) {
        const ids = tx.messages
          .map((m) => {
            const rawId = m?.details?.ruleId as string | number | undefined;
            if (rawId === undefined || rawId === null) return null;
            const n = typeof rawId === 'number' ? rawId : Number(rawId);
            return Number.isFinite(n) ? Math.trunc(n) : null;
          })
          .filter((n): n is number => n !== null);
        normalized.rule_ids = ids.length ? ids : null;
      }

      // Headers & bodies
      normalized.request_headers =
        (req.headers as Record<string, string>) || null;
      normalized.response_headers =
        (res.headers as Record<string, string>) || null;
      normalized.request_body = (req.body as string | null) || null;
      normalized.response_body = (res.body as string | null) || null;
    }

    return normalized;
  }

  private normalizeHost(input: string): string {
    const trimmed = input.trim().toLowerCase();
    const idx = trimmed.indexOf(':');
    return idx > -1 ? trimmed.slice(0, idx) : trimmed;
  }

  // Extract user/tenant id from log content based on our Nginx/ModSecurity setup
  private extractUserIdFromLogRecord(record: IngestLog): string | null {
    const source = (record as any).source;

    // 1) Access logs: Nginx JSON access log includes user_id directly
    if (source === 'access') {
      const r = record as AccessIngestLog as any;
      const candidates = [
        r.user_id,
        r.tenant,
        r.tenant_id,
        r['X-Tenant-Id'],
        r['x-tenant-id'],
      ];
      for (const c of candidates) {
        if (c !== undefined && c !== null) {
          return String(c);
        }
      }
      // In some pipelines, headers may appear under r.headers or r.request_headers
      const headers: Record<string, string> | undefined =
        r.headers || r.request_headers;
      const h = this.getHeaderCaseInsensitive(headers, 'x-tenant-id');
      if (h) return h;
      return null;
    }

    // 2) WAF logs: prefer request header X-Tenant-Id, fallback to messages with "tenant=<id>"
    if (source === 'waf') {
      const r = record as WafIngestLog;
      const headers = r.transaction?.request?.headers || undefined;
      const headerVal = this.getHeaderCaseInsensitive(headers, 'x-tenant-id');
      if (headerVal) return headerVal;

      // Parse messages emitted by phase:5 SecAction: msg:'tenant=%{tx.user_id}'
      const msgs = r.transaction?.messages || [];
      for (const m of msgs) {
        const text = m?.message || '';
        const match = text.match(/tenant=([A-Za-z0-9_\-:\.]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }

    return null;
  }

  private getHeaderCaseInsensitive(
    headers: Record<string, string> | undefined,
    name: string,
  ): string | null {
    if (!headers) return null;
    const target = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === target) return String(v);
    }
    return null;
  }
}
