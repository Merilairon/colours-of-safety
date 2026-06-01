import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';

/**
 * Seeds a default reviewer account on first boot so the moderation queue is
 * usable out of the box. Credentials are configurable via env vars.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAccount(
      this.config.get<string>('REVIEWER_EMAIL', 'reviewer@coloursofsafety.com'),
      this.config.get<string>('REVIEWER_PASSWORD', 'reviewer123'),
      'Default Reviewer',
      UserRole.REVIEWER,
    );

    await this.seedAccount(
      this.config.get<string>(
        'SUPER_ADMIN_EMAIL',
        'superadmin@coloursofsafety.com',
      ),
      this.config.get<string>('SUPER_ADMIN_PASSWORD', 'superadmin123'),
      'Default Super Admin',
      UserRole.SUPER_ADMIN,
    );
  }

  private async seedAccount(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<void> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = await this.users.create({
      email,
      displayName,
      passwordHash,
      role,
    });
    this.logger.log(`Seeded ${role} account: ${user.email}`);
  }
}
