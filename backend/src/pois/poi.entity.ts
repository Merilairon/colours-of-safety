import type { Point } from 'geojson';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewStatus } from '../common/review-status.enum';
import { User } from '../users/user.entity';

@Entity('pois')
export class Poi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: 'other' })
  category: string;

  /** 1 (unsafe) – 5 (very safe / explicitly welcoming). */
  @Column({ type: 'int', default: 3 })
  safetyRating: number;

  @Column({ default: false })
  wheelchairAccessible: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ default: false })
  banned: boolean;

  @Column({ type: 'int', default: 0 })
  voteCount: number;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
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
