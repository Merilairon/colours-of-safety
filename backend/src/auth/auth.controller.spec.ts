import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, AuthResult } from './auth.service';
import { UserRole } from '../users/user.entity';
import type { AuthUser } from './jwt-payload.interface';
import { SESSION_COOKIE } from './session-cookie';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'register' | 'login'>>;
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  const config = {
    get: (key: string, fallback?: string) =>
      ({ NODE_ENV: 'production', JWT_EXPIRES_IN: '7d' })[key] ?? fallback,
  };

  beforeEach(async () => {
    const mockAuthResult: AuthResult = {
      accessToken: 'test-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        emailVerified: false,
        banned: false,
      },
    };

    authService = {
      register: jest.fn().mockResolvedValue(mockAuthResult),
      login: jest.fn().mockResolvedValue(mockAuthResult),
    };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  const asResponse = () => res as unknown as Response;

  const expectSessionCookie = () => {
    expect(res.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE,
      'test-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  };

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'password123',
    };

    it('delegates to auth service and returns the user', async () => {
      const result = await controller.register(dto, asResponse());

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        user: expect.objectContaining({
          email: 'test@example.com',
        }) as AuthUser,
      });
    });

    it('sets the JWT as an HttpOnly cookie and never returns it', async () => {
      const result = await controller.register(dto, asResponse());

      expectSessionCookie();
      expect(result).not.toHaveProperty('accessToken');
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('delegates to auth service and returns the user', async () => {
      const result = await controller.login(dto, asResponse());

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result.user.email).toBe('test@example.com');
    });

    it('sets the JWT as an HttpOnly cookie and never returns it', async () => {
      const result = await controller.login(dto, asResponse());

      expectSessionCookie();
      expect(result).not.toHaveProperty('accessToken');
    });
  });

  describe('logout', () => {
    it('clears the session cookie', () => {
      controller.logout(asResponse());

      expect(res.clearCookie).toHaveBeenCalledWith(
        SESSION_COOKIE,
        expect.objectContaining({ path: '/api', httpOnly: true }),
      );
    });
  });

  describe('me', () => {
    it('returns current user from decorator', () => {
      const currentUser: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        emailVerified: true,
        banned: false,
      };

      const result = controller.me(currentUser);

      expect(result).toBe(currentUser);
    });

    it('returns admin user correctly', () => {
      const adminUser: AuthUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: UserRole.ADMIN,
        emailVerified: true,
        banned: false,
      };

      const result = controller.me(adminUser);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('returns reviewer user correctly', () => {
      const reviewerUser: AuthUser = {
        id: 'reviewer-1',
        email: 'reviewer@example.com',
        displayName: 'Reviewer User',
        role: UserRole.REVIEWER,
        emailVerified: true,
        banned: false,
      };

      const result = controller.me(reviewerUser);

      expect(result.role).toBe(UserRole.REVIEWER);
    });
  });
});
