import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, AuthResult } from './auth.service';
import { UserRole } from '../users/user.entity';
import type { AuthUser } from './jwt-payload.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'register' | 'login'>>;

  beforeEach(async () => {
    const mockAuthResult: AuthResult = {
      accessToken: 'test-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
      },
    };

    authService = {
      register: jest.fn().mockResolvedValue(mockAuthResult),
      login: jest.fn().mockResolvedValue(mockAuthResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('register', () => {
    it('delegates to auth service', async () => {
      const dto = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        accessToken: 'test-token',
        user: expect.objectContaining({
          email: 'test@example.com',
        }) as AuthUser,
      });
    });

    it('returns auth result with token', async () => {
      const dto = {
        email: 'new@example.com',
        displayName: 'New User',
        password: 'password123',
      };

      const result = await controller.register(dto);

      expect(result.accessToken).toBe('test-token');
      expect(result.user).toBeDefined();
    });
  });

  describe('login', () => {
    it('delegates to auth service', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        accessToken: 'test-token',
        user: expect.objectContaining({
          email: 'test@example.com',
        }) as AuthUser,
      });
    });

    it('returns auth result with token', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.login(dto);

      expect(result.accessToken).toBe('test-token');
      expect(result.user).toBeDefined();
    });
  });

  describe('me', () => {
    it('returns current user from decorator', () => {
      const currentUser: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
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
      };

      const result = controller.me(reviewerUser);

      expect(result.role).toBe(UserRole.REVIEWER);
    });
  });
});
