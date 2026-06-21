import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from './jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return defaultValue;
            }),
          },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  describe('constructor', () => {
    it('configures strategy with JWT from bearer token', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('returns AuthUser when payload is valid and user exists', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: UserRole.USER,
        banned: false,
      };

      const user = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        passwordHash: 'hash',
        pronouns: null,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        banned: false,
        bannedAt: null,
        banReason: null,
        createdAt: new Date(),
      } as User;

      usersService.findById.mockResolvedValueOnce(user);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        emailVerified: false,
        banned: false,
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      const payload: JwtPayload = {
        sub: 'nonexistent',
        email: 'test@example.com',
        role: UserRole.USER,
        banned: false,
      };

      usersService.findById.mockResolvedValueOnce(null);

      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('throws UnauthorizedException when user is banned', async () => {
      const payload: JwtPayload = {
        sub: 'banned-user',
        email: 'banned@example.com',
        role: UserRole.USER,
        banned: false,
      };

      const user = {
        id: 'banned-user',
        email: 'banned@example.com',
        displayName: 'Banned User',
        role: UserRole.USER,
        passwordHash: 'hash',
        pronouns: null,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        banned: true,
        bannedAt: new Date(),
        banReason: 'Spam',
        createdAt: new Date(),
      } as User;

      usersService.findById.mockResolvedValueOnce(user);

      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.findById).toHaveBeenCalledWith('banned-user');
    });

    it('preserves role information from token', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        banned: false,
      };

      const user = {
        id: 'user-1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: UserRole.ADMIN,
        passwordHash: 'hash',
        pronouns: null,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        banned: false,
        bannedAt: null,
        banReason: null,
        createdAt: new Date(),
      } as User;

      usersService.findById.mockResolvedValueOnce(user);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('handles reviewer role correctly', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'reviewer@example.com',
        role: UserRole.REVIEWER,
        banned: false,
      };

      const user = {
        id: 'user-1',
        email: 'reviewer@example.com',
        displayName: 'Reviewer User',
        role: UserRole.REVIEWER,
        passwordHash: 'hash',
        pronouns: null,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        banned: false,
        bannedAt: null,
        banReason: null,
        createdAt: new Date(),
      } as User;

      usersService.findById.mockResolvedValueOnce(user);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.REVIEWER);
    });

    it('handles super_admin role correctly', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'super@example.com',
        role: UserRole.SUPER_ADMIN,
        banned: false,
      };

      const user = {
        id: 'user-1',
        email: 'super@example.com',
        displayName: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: 'hash',
        pronouns: null,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        banned: false,
        bannedAt: null,
        banReason: null,
        createdAt: new Date(),
      } as User;

      usersService.findById.mockResolvedValueOnce(user);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.SUPER_ADMIN);
    });
  });
});
