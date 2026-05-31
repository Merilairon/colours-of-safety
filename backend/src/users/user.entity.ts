import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  REVIEWER = 'reviewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Excluded from API responses: contributor emails must not leak publicly
  // (e.g. via an approved POI's createdBy relation).
  @Exclude()
  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Exclude()
  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
