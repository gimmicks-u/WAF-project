import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum LogSource {
  ACCESS = 'access',
  WAF = 'waf',
}

export enum LogAction {
  ALLOWED = 'allowed',
  DETECTED = 'detected',
  BLOCKED = 'blocked',
  UNKNOWN = 'unknown',
}

@Entity('logs')
@Index('idx_logs_ts', ['ts'])
@Index('idx_logs_source_ts', ['source', 'ts'])
@Index('idx_logs_ip_ts', ['ip', 'ts'])
export class Log {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'timestamptz' })
  ts: Date;

  @Column({ type: 'text' })
  source: string | null;

  @Column({ type: 'text' })
  action: LogAction;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  method: string | null;

  @Column({ type: 'text', nullable: true })
  uri: string | null;

  @Column({ type: 'int', nullable: true })
  status: number | null;

  @Column({ type: 'int', array: true, nullable: true })
  rule_ids: number[] | null;

  @Column({ type: 'jsonb', nullable: true })
  request_headers: Record<string, string> | null;

  @Column({ type: 'jsonb', nullable: true })
  response_headers: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  request_body: string | null;

  @Column({ type: 'text', nullable: true })
  response_body: string | null;

  @Column({ type: 'jsonb' })
  raw: any;
}
