import { Controller, Post, Body, Inject, Get, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '../database/database.module';
import { LogsQueryDto } from './dto/logs-query.dto';

// Strong types for ingest payload and normalization output
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
  status?: number; // fallback if present
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
  // Allow other unknown properties without using any
  [key: string]: unknown;
}

// Minimal access log shape retained for backward compatibility
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
  // Allow other unknown properties without using any
  [key: string]: unknown;
}

type IngestLog = WafIngestLog | AccessIngestLog;

interface NormalizedRecord {
  ts: Date;
  source: 'access' | 'waf';
  action: 'allowed' | 'detected' | 'blocked' | 'unknown';
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
}

@Controller()
export class LogsController {
  constructor(@Inject(PG_CONNECTION) private pool: Pool) {}

  @Post('ingest/logs')
  async ingestLogs(@Body() body: IngestLog | IngestLog[]) {
    const records: IngestLog[] = Array.isArray(body) ? body : [body];

    const client = await this.pool.connect();
    try {
      for (const record of records) {
        const normalized = this.normalizeRecord(record);
        await client.query(
          `INSERT INTO logs (ts, source, action, ip, method, uri, status, rule_ids,
           request_headers, response_headers, request_body, response_body, raw)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            normalized.ts,
            normalized.source,
            normalized.action,
            normalized.ip,
            normalized.method,
            normalized.uri,
            normalized.status,
            normalized.rule_ids,
            normalized.request_headers,
            normalized.response_headers,
            normalized.request_body,
            normalized.response_body,
            normalized.raw,
          ],
        );
      }
    } finally {
      client.release();
    }

    return { success: true };
  }

  @Get('logs')
  async getLogs(@Query() query: LogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: unknown[] = [];

    const pushCond = (cond: string, val: string | number | Date) => {
      params.push(val);
      whereConditions.push(`${cond} $${params.length}`);
    };

    if (query.from) pushCond('ts >=', query.from);
    if (query.to) pushCond('ts <=', query.to);
    if (query.ip) pushCond('ip =', query.ip);
    if (query.uri) pushCond('uri ILIKE', `%${query.uri}%`);
    if (query.method) pushCond('method =', query.method.toUpperCase());
    if (query.status !== undefined) pushCond('status =', query.status);
    if (query.action) pushCond('action =', query.action);
    if (query.source) pushCond('source =', query.source);
    if (query.rule_id !== undefined)
      whereConditions.push(`$${params.push(query.rule_id)} = ANY(rule_ids)`);

    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countRes = await this.pool.query(
      `SELECT COUNT(*) FROM logs ${whereClause}`,
      params as any[],
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const rowsRes = await this.pool.query(
      `SELECT * FROM logs ${whereClause} ORDER BY ts DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset] as any[],
    );

    return {
      items: rowsRes.rows,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
    };
  }

  private normalizeRecord(record: IngestLog): NormalizedRecord {
    const source = record.source;

    // Determine timestamp without using any
    let tsInput: string | number = Date.now();
    if (source === 'waf') {
      tsInput = (record as WafIngestLog).timestamp;
    } else if (source === 'access') {
      const r = record as AccessIngestLog;
      tsInput = r.timestamp ?? r.time ?? r['@timestamp'] ?? Date.now();
    }

    const normalized: NormalizedRecord = {
      ts: new Date(tsInput),
      source,
      raw: record,
      action: 'unknown',
      ip: null,
      method: null,
      uri: null,
      status: null,
      rule_ids: null,
      request_headers: null,
      response_headers: null,
      request_body: null,
      response_body: null,
    };

    if (source === 'access') {
      const r = record as AccessIngestLog;
      const statusVal = r.status != null ? Number(r.status) : null;
      normalized.status = Number.isFinite(statusVal as number)
        ? (statusVal as number)
        : null;
      normalized.action =
        normalized.status != null && (normalized.status as number) >= 400
          ? 'blocked'
          : 'allowed';
      normalized.ip = r.remote_addr ?? null;
      normalized.method = (r.request_method || '').toUpperCase() || null;
      normalized.uri = r.request_uri || r.uri || null;
    } else if (source === 'waf') {
      const tx = (record as WafIngestLog).transaction || {};
      const req = tx.request || {};
      const res = tx.response || {};

      const status =
        (res.http_code as number | undefined) ?? (res.status as number | undefined) ?? null;
      normalized.status = status ?? null;

      if (status != null && status >= 400) {
        normalized.action = 'blocked';
      } else if (Array.isArray(tx.messages) && tx.messages.length > 0) {
        normalized.action = 'detected';
      } else {
        normalized.action = 'allowed';
      }

      normalized.ip = tx.client_ip ?? null;
      normalized.method = (req.method || '') ? (req.method as string).toUpperCase() : null;
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

      // Headers & bodies (store as-is per requirement)
      normalized.request_headers = (req.headers as Record<string, string>) || null;
      normalized.response_headers = (res.headers as Record<string, string>) || null;
      normalized.request_body = (req.body as string | null) || null;
      normalized.response_body = (res.body as string | null) || null;
    }

    return normalized;
  }
}
