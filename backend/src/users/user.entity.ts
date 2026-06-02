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
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Pronouns {
  THEY_THEM = 'they/them',
  SHE_HER = 'she/her',
  HE_HIM = 'he/him',
  ZE_ZIR = 'ze/zir',
  PREFER_NOT_TO_SAY = 'prefer not to say',
  CUSTOM = 'custom',
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

  @Column({ type: 'enum', enum: Pronouns, nullable: true, default: null })
  pronouns: Pronouns | null;

  @CreateDateColumn()
  createdAt: Date;
}
