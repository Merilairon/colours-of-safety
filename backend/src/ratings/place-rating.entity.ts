import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Poi } from '../pois/poi.entity';
import { User } from '../users/user.entity';

/**
 * A community member's own safety rating and short review of an approved
 * place (LSA-F5). One per person per place; rating again updates it.
 */
@Entity('place_ratings')
@Unique(['poiId', 'authorId'])
export class PlaceRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Poi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poiId' })
  poi: Poi;

  @Column()
  poiId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  /** 1 (unsafe) – 5 (very welcoming), same scale as `Poi.safetyRating`. */
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', default: '' })
  comment: string;

  /** Hides the author's name from everyone except them and moderators. */
  @Column({ default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
