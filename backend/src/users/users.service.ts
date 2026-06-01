import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

export interface CreateUserData {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
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
}
