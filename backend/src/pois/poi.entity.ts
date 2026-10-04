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
import { PlaceSource } from '../common/place-source.enum';
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

  @Column({ type: 'varchar', length: 300, nullable: true })
  address: string | null;

  /** http(s) URL only; validated on input. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  /** Free text, typically in OSM `opening_hours` syntax (e.g. "Mo-Fr 10:00-18:00"). */
  @Column({ type: 'varchar', length: 300, nullable: true })
  openingHours: string | null;

  /** Origin of the record; see {@link PlaceSource}. */
  @Column({ type: 'varchar', length: 20, default: PlaceSource.COMMUNITY })
  source: PlaceSource;

  /** Link to the upstream record (OSM element, Wikidata item) for imports. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceUrl: string | null;

  /**
   * Last time a person confirmed this entry: a reviewer approval, an
   * approved edit or a community rating. Null for unconfirmed imports.
   */
  @Column({ type: 'timestamptz', nullable: true })
  lastVerifiedAt: Date | null;

  /** Number of community ratings (LSA-F5); kept in sync by RatingsService. */
  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  /** Mean community rating 1–5, null until someone rates the place. */
  @Column({ type: 'real', nullable: true })
  communityRating: number | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
