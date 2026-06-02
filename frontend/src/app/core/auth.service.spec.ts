import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthResult, AuthUser } from './models';
import type { HttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpClientMock: HttpClient;

  beforeEach(() => {
    httpClientMock = {
      post: vi.fn().mockReturnValue(of({})),
    } as unknown as HttpClient;

    service = new AuthService(httpClientMock);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('initializes with null user when localStorage empty', () => {
      expect(service.user()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
      expect(service.isReviewer()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });

    it('restores user from localStorage on init', () => {
      const mockUser: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
      };
      localStorage.setItem('cos.user', JSON.stringify(mockUser));
      localStorage.setItem('cos.token', 'test-token');

      const newService = new AuthService(httpClientMock);

      expect(newService.user()).toEqual(mockUser);
      expect(newService.isLoggedIn()).toBe(true);
    });

    it('handles invalid localStorage data gracefully', () => {
      localStorage.setItem('cos.user', 'invalid-json');

      const newService = new AuthService(httpClientMock);

      expect(newService.user()).toBeNull();
    });
  });

  describe('register', () => {
    it('registers user and persists auth data', () => {
      const mockResult: AuthResult = {
        accessToken: 'new-token',
        user: {
          id: 'user-1',
          email: 'new@example.com',
          displayName: 'New User',
          role: 'user',
        },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.register('new@example.com', 'New User', 'password123').subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      expect(httpClientMock.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'new@example.com',
        displayName: 'New User',
        password: 'password123',
      });

      expect(service.user()).toEqual(mockResult.user);
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem('cos.token')).toBe('new-token');
      expect(localStorage.getItem('cos.user')).toBe(JSON.stringify(mockResult.user));
    });
  });

  describe('login', () => {
    it('logs in user and persists auth data', () => {
      const mockResult: AuthResult = {
        accessToken: 'auth-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'user',
        },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.login('test@example.com', 'password123').subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      expect(httpClientMock.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(service.user()).toEqual(mockResult.user);
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem('cos.token')).toBe('auth-token');
    });
  });

  describe('logout', () => {
    it('clears user data and localStorage', () => {
      const mockUser: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
      };
      localStorage.setItem('cos.user', JSON.stringify(mockUser));
      localStorage.setItem('cos.token', 'token');

      const newService = new AuthService(httpClientMock);
      expect(newService.user()).not.toBeNull();

      newService.logout();

      expect(newService.user()).toBeNull();
      expect(newService.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('cos.token')).toBeNull();
      expect(localStorage.getItem('cos.user')).toBeNull();
    });
  });

  describe('token', () => {
    it('returns token from localStorage', () => {
      localStorage.setItem('cos.token', 'my-token');

      expect(service.token).toBe('my-token');
    });

    it('returns null when no token', () => {
      expect(service.token).toBeNull();
    });
  });

  describe('role-based computed signals', () => {
    it('isReviewer returns true for reviewer role', () => {
      const mockResult: AuthResult = {
        accessToken: 'token',
        user: { id: '1', email: 'r@example.com', displayName: 'Reviewer', role: 'reviewer' },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.login('r@example.com', 'pass').subscribe();

      expect(service.isReviewer()).toBe(true);
      expect(service.isAdmin()).toBe(false);
    });

    it('isAdmin returns true for admin role', () => {
      const mockResult: AuthResult = {
        accessToken: 'token',
        user: { id: '1', email: 'a@example.com', displayName: 'Admin', role: 'admin' },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.login('a@example.com', 'pass').subscribe();

      expect(service.isAdmin()).toBe(true);
      expect(service.isReviewer()).toBe(true);
    });

    it('isAdmin returns true for super_admin role', () => {
      const mockResult: AuthResult = {
        accessToken: 'token',
        user: { id: '1', email: 'sa@example.com', displayName: 'Super', role: 'super_admin' },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.login('sa@example.com', 'pass').subscribe();

      expect(service.isAdmin()).toBe(true);
      expect(service.isReviewer()).toBe(true);
    });

    it('role checks return false for regular user', () => {
      const mockResult: AuthResult = {
        accessToken: 'token',
        user: { id: '1', email: 'u@example.com', displayName: 'User', role: 'user' },
      };

      (httpClientMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of(mockResult));

      service.login('u@example.com', 'pass').subscribe();

      expect(service.isReviewer()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });
  });
});
