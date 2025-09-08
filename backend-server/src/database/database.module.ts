import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_CONNECTION = 'PG_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      useFactory: async () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        await pool.query(`
          CREATE TABLE IF NOT EXISTS logs (
            id BIGSERIAL PRIMARY KEY,
            ts TIMESTAMPTZ NOT NULL,
            source TEXT CHECK (source IN ('access','waf')) NOT NULL,
            action TEXT CHECK (action IN ('allowed','detected','blocked','unknown')) NOT NULL,
            ip INET NULL,
            method TEXT NULL,
            uri TEXT NULL,
            status INT NULL,
            rule_ids INT[] NULL,
            request_headers JSONB NULL,
            response_headers JSONB NULL,
            request_body TEXT NULL,
            response_body TEXT NULL,
            raw JSONB NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);
          CREATE INDEX IF NOT EXISTS idx_logs_source_ts ON logs(source, ts DESC);
          CREATE INDEX IF NOT EXISTS idx_logs_ip_ts ON logs(ip, ts DESC);
        `);

        return pool;
      },
    },
  ],
  exports: [PG_CONNECTION],
})
export class DatabaseModule {}

