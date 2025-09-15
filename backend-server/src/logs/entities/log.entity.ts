import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

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
@Index('idx_logs_user_ts', ['user_id', 'ts'])
export class Log {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'timestamptz' })
  ts: Date;

  // Tenant owner (nullable if not resolved)
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

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
