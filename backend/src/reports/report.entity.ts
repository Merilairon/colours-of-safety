import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export const REPORT_TARGET_TYPES = ['poi', 'district', 'rating'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  'closed',
  'wrong_location',
  'wrong_details',
  'not_safe',
  'not_lgbtq_related',
  'duplicate',
  'offensive',
  'spam',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export enum ReportStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/** Someone flagging a place, district or rating for moderators (LSA-F4). */
@Entity('reports')
@Index(['status', 'createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  targetType: ReportTargetType;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar', length: 30 })
  reason: ReportReason;

  @Column({ type: 'text', default: '' })
  details: string;

  /** Null for guests: someone at a place that became unsafe may have no account. */
  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User | null;

  @Column({ type: 'uuid', nullable: true })
  reporterId: string | null;

  @Column({ type: 'varchar', length: 20, default: ReportStatus.OPEN })
  status: ReportStatus;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string | null;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
