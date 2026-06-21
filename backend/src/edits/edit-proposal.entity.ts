import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewStatus } from '../common/review-status.enum';
import { User } from '../users/user.entity';

export type EditTargetType = 'poi' | 'district';

export interface EditProposalData {
  name?: string;
  category?: string;
  description?: string;
  safetyRating?: number;
  wheelchairAccessible?: boolean;
  location?: { type: 'Point'; coordinates: [number, number] };
  area?: { type: 'Polygon'; coordinates: number[][][] };
  blendEdges?: boolean;
}

@Entity('edit_proposals')
export class EditProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  targetType: EditTargetType;

  @Column({ type: 'varchar' })
  targetId: string;

  @Column({ type: 'jsonb' })
  originalData: EditProposalData;

  @Column({ type: 'jsonb' })
  proposedData: EditProposalData;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar' })
  createdById: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
