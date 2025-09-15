import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DomainStatus {
  PENDING = 'pending',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

@Entity('domains')
@Index(['user_id'], { unique: true })
@Index(['domain'], { unique: true })
@Index(['status'])
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', nullable: false })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', unique: true, nullable: false })
  domain: string;

  @Column({ type: 'text', nullable: false })
  origin_ip: string;

  @Column({
    type: 'enum',
    enum: DomainStatus,
    default: DomainStatus.PENDING,
  })
  status: DomainStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
