import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('waf_log_stats')
@Unique(['dateBucket', 'hourBucket'])
@Index('idx_waf_log_stats_date_hour', ['dateBucket', 'hourBucket'])
export class WafLogStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'date_bucket', type: 'date' })
  dateBucket: Date;

  @Column({ name: 'hour_bucket', type: 'int' })
  hourBucket: number;

  // Counters
  @Column({ name: 'total_requests', type: 'int', default: 0 })
  totalRequests: number;

  @Column({ name: 'blocked_requests', type: 'int', default: 0 })
  blockedRequests: number;

  @Column({ name: 'allowed_requests', type: 'int', default: 0 })
  allowedRequests: number;

  @Column({ name: 'error_requests', type: 'int', default: 0 })
  errorRequests: number;

  // Response time statistics
  @Column({
    name: 'avg_response_time',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  avgResponseTime?: number;

  @Column({
    name: 'max_response_time',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  maxResponseTime?: number;

  // Top threat types (JSONB for flexibility)
  @Column({ name: 'threat_types', type: 'jsonb', default: '{}' })
  threatTypes: any;

  @Column({ name: 'top_blocked_ips', type: 'jsonb', default: '{}' })
  topBlockedIps: any;

  // Timestamps
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
