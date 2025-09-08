import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LogAction {
  BLOCKED = 'blocked',
  ALLOWED = 'allowed',
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
}

@Entity('waf_logs')
@Index('idx_waf_logs_timestamp', ['timestamp'])
@Index('idx_waf_logs_client_ip', ['clientIp'])
@Index('idx_waf_logs_action', ['action'])
@Index('idx_waf_logs_status_code', ['statusCode'])
@Index('idx_waf_logs_blocked', ['blocked'])
@Index('idx_waf_logs_rule_id', ['ruleId'])
@Index('idx_waf_logs_threat_type', ['threatType'])
@Index('idx_waf_logs_method', ['method'])
export class WafLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Timestamp information
  @Column({ type: 'timestamptz' })
  @Index('idx_waf_logs_timestamp_desc', { synchronize: false })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Request information
  @Column({ name: 'client_ip', type: 'inet' })
  clientIp: string;

  @Column({ type: 'enum', enum: RequestMethod })
  method: RequestMethod;

  @Column({ name: 'request_uri', type: 'text' })
  requestUri: string;

  @Column({ name: 'request_url', type: 'text', nullable: true })
  requestUrl?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;

  // Response information
  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ name: 'response_size', type: 'bigint', default: 0 })
  responseSize: number;

  @Column({ name: 'request_size', type: 'bigint', default: 0 })
  requestSize: number;

  @Column({
    name: 'request_time',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  requestTime?: number;

  // Upstream information
  @Column({ name: 'upstream_addr', type: 'text', nullable: true })
  upstreamAddr?: string;

  @Column({ name: 'upstream_status', type: 'int', nullable: true })
  upstreamStatus?: number;

  @Column({
    name: 'upstream_response_time',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  upstreamResponseTime?: number;

  // ModSecurity information
  @Column({ name: 'modsec_transaction_id', type: 'text', nullable: true })
  modsecTransactionId?: string;

  @Column({ name: 'modsec_audit_log_parts', type: 'text', nullable: true })
  modsecAuditLogParts?: string;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @Column({ type: 'enum', enum: LogAction })
  action: LogAction;

  @Column({ name: 'rule_id', type: 'int', nullable: true })
  ruleId?: number;

  @Column({ name: 'rule_message', type: 'text', nullable: true })
  ruleMessage?: string;

  @Column({ name: 'threat_type', type: 'varchar', length: 100, nullable: true })
  threatType?: string;

  // Raw log data (for debugging and future analysis)
  @Column({ name: 'raw_log', type: 'jsonb' })
  rawLog: any;

  // Additional metadata
  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  // Audit trail
  @Column({ name: 'processed_at', type: 'timestamptz', default: () => 'NOW()' })
  processedAt: Date;
}
