import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { Pronouns, User, UserRole } from './user.entity';

export interface CreateUserData {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: UserRole;
  pronouns?: Pronouns;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

export interface UpdateUserData {
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Poi)
    private readonly pois: Repository<Poi>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
  ) {}

  create(data: CreateUserData): Promise<User> {
    const user = this.users.create(data);
    return this.users.save(user);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  /** Includes the normally-hidden passwordHash column, for auth checks. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  count(): Promise<number> {
    return this.users.count();
  }

  listAll(): Promise<User[]> {
    return this.users.find();
  }

  async assignRole(id: string, role: UserRole): Promise<User> {
    await this.users.update(id, { role });
    return this.users.findOneOrFail({ where: { id } });
  }

  async setBanStatus(
    id: string,
    banned: boolean,
    reason?: string,
  ): Promise<User> {
    await this.users.update(id, {
      banned,
      bannedAt: banned ? new Date() : null,
      banReason: banned ? (reason ?? null) : null,
    });
    await this.pois.update({ createdById: id }, { banned });
    await this.districts.update({ createdById: id }, { banned });
    return this.users.findOneOrFail({ where: { id } });
  }

  async update(id: string, data: UpdateUserData): Promise<void> {
    await this.users.update(id, data);
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.users.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: MoreThan(new Date()),
      },
    });
  }
}
