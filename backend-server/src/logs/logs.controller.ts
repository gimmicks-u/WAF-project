import { Controller, Post, Body, Inject, Get, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '../database/database.module';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsISO8601,
  IsEnum,
  IsIP,
} from 'class-validator';

class LogsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIP()
  ip?: string;

  @IsOptional()
  uri?: string;

  @IsOptional()
  method?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  status?: number;

  @IsOptional()
  @IsEnum(['allowed', 'detected', 'blocked'])
  action?: 'allowed' | 'detected' | 'blocked';

  @IsOptional()
  @IsEnum(['access', 'waf'])
  source?: 'access' | 'waf';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  rule_id?: number;
}

@Controller()
export class LogsController {
  constructor(@Inject(PG_CONNECTION) private pool: Pool) {}

  @Post('ingest/logs')
  async ingestLogs(@Body() body: any | any[]) {
    const records = Array.isArray(body) ? body : [body];

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
    const params: any[] = [];

    const pushCond = (cond: string, val: any) => {
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
      params,
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const rowsRes = await this.pool.query(
      `SELECT * FROM logs ${whereClause} ORDER BY ts DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return {
      items: rowsRes.rows,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
    };
  }

  private normalizeRecord(record: any) {
    const source = record.source;
    const normalized: any = {
      ts: new Date(
        record.timestamp || record.time || record['@timestamp'] || Date.now(),
      ),
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
      const status = record.status != null ? parseInt(record.status, 10) : null;
      normalized.status = status;
      normalized.action = status != null && status >= 400 ? 'blocked' : 'allowed';
      normalized.ip = record.remote_addr || record['remote_addr'];
      normalized.method = (record.request_method || '').toUpperCase();
      normalized.uri = record.request_uri || record.uri;
    } else if (source === 'waf') {
      const tx = record.transaction || {};
      const req = tx.request || {};
      const res = tx.response || {};

      // Action
      const interrupted =
        !!tx.interruption || (res.status && res.status >= 400);
      if (interrupted) normalized.action = 'blocked';
      else if (Array.isArray(tx.messages) && tx.messages.length)
        normalized.action = 'detected';

      normalized.ip = tx.client_ip || null;
      normalized.method = (req.method || '').toUpperCase();
      normalized.uri = req.uri || null;
      normalized.status = res.status ?? null;
      normalized.rule_ids = Array.isArray(tx.messages)
        ? tx.messages
            .map((m: any) => m.details?.ruleId)
            .filter((x: any) => Number.isInteger(x))
        : null;

      // Headers & bodies (store as-is)
      normalized.request_headers = req.headers || null;
      normalized.response_headers = res.headers || null;
      normalized.request_body = req.body || null;
      normalized.response_body = res.body || null;
    }

    return normalized;
  }
}
