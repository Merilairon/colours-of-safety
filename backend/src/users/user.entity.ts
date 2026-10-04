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

export interface NotificationPreferences {
  emailUpdates: boolean;
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

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({
    type: 'simple-enum',
    enum: Pronouns,
    nullable: true,
    default: null,
  })
  pronouns: Pronouns | null;

  @Column({ default: false })
  emailVerified: boolean;

  // Secrets and private account state. Only ever returned through explicit
  // DTOs (e.g. the profile response), never via entity serialisation.
  // Tokens are stored as SHA-256 hashes.
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ default: false })
  banned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  bannedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  banReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Exclude()
  @Column({ type: 'jsonb', default: { emailUpdates: true } })
  notificationPreferences: NotificationPreferences;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  pendingEmail: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailChangeToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  emailChangeExpires: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires: Date | null;

  /** Sessions issued before this moment are rejected by the JWT strategy. */
  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
