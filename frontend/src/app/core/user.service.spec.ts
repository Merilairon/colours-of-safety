import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { AuthUser } from './models';
import type { HttpClient } from '@angular/common/http';

describe('UserService', () => {
  let service: UserService;
  let httpClientMock: {
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of([])),
      patch: vi.fn().mockReturnValue(of({})),
    };

    service = new UserService(httpClientMock as unknown as HttpClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches all users', () => {
      const mockUsers: AuthUser[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: 'user',
          emailVerified: true,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: 'reviewer',
          emailVerified: true,
        },
        {
          id: 'user-3',
          email: 'user3@example.com',
          displayName: 'User 3',
          role: 'admin',
          emailVerified: true,
        },
      ];
      httpClientMock.get.mockReturnValue(of(mockUsers));

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
      });

      expect(httpClientMock.get).toHaveBeenCalledWith('/api/users');
    });

    it('handles empty user list', () => {
      httpClientMock.get.mockReturnValue(of([]));

      service.getUsers().subscribe((users) => {
        expect(users).toEqual([]);
      });

      expect(httpClientMock.get).toHaveBeenCalledWith('/api/users');
    });
  });

  describe('updateUserRole', () => {
    it('updates user role to reviewer', () => {
      const updatedUser: AuthUser = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        role: 'reviewer',
        emailVerified: true,
      };
      httpClientMock.patch.mockReturnValue(of(updatedUser));

      service.updateUserRole('user-1', 'reviewer').subscribe((user) => {
        expect(user).toEqual(updatedUser);
      });

      expect(httpClientMock.patch).toHaveBeenCalledWith('/api/users/user-1/role', {
        role: 'reviewer',
      });
    });

    it('updates user role to admin', () => {
      const updatedUser: AuthUser = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        role: 'admin',
        emailVerified: true,
      };
      httpClientMock.patch.mockReturnValue(of(updatedUser));

      service.updateUserRole('user-1', 'admin').subscribe((user) => {
        expect(user).toEqual(updatedUser);
      });

      expect(httpClientMock.patch).toHaveBeenCalledWith('/api/users/user-1/role', {
        role: 'admin',
      });
    });

    it('updates user role to super_admin', () => {
      const updatedUser: AuthUser = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        role: 'super_admin',
        emailVerified: true,
      };
      httpClientMock.patch.mockReturnValue(of(updatedUser));

      service.updateUserRole('user-1', 'super_admin').subscribe((user) => {
        expect(user).toEqual(updatedUser);
      });

      expect(httpClientMock.patch).toHaveBeenCalledWith('/api/users/user-1/role', {
        role: 'super_admin',
      });
    });

    it('updates user role to regular user', () => {
      const updatedUser: AuthUser = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        role: 'user',
        emailVerified: true,
      };
      httpClientMock.patch.mockReturnValue(of(updatedUser));

      service.updateUserRole('user-1', 'user').subscribe((user) => {
        expect(user).toEqual(updatedUser);
      });

      expect(httpClientMock.patch).toHaveBeenCalledWith('/api/users/user-1/role', { role: 'user' });
    });
  });
});
