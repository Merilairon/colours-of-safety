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
    const email = this.config.get<string>(
      'REVIEWER_EMAIL',
      'reviewer@colours-of-safety.org',
    );
    const password = this.config.get<string>(
      'REVIEWER_PASSWORD',
      'reviewer123',
    );

    const existing = await this.users.findByEmail(email);
    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const reviewer: User = await this.users.create({
      email,
      displayName: 'Default Reviewer',
      passwordHash,
      role: UserRole.REVIEWER,
    });
    this.logger.log(`Seeded default reviewer account: ${reviewer.email}`);
  }
}
