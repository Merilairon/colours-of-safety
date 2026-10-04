import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthResult, AuthUser } from './models';
import type { HttpClient } from '@angular/common/http';

const userWith = (role: AuthUser['role']): AuthUser => ({
  id: 'user-1',
  email: `${role}@example.com`,
  displayName: 'Test User',
  role,
  emailVerified: true,
});

describe('AuthService', () => {
  let service: AuthService;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    http = {
      get: vi.fn().mockReturnValue(throwError(() => ({ status: 401 }))),
      post: vi.fn().mockReturnValue(of({})),
    };
    service = new AuthService(http as unknown as HttpClient);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('session restore', () => {
    it('starts logged out', () => {
      expect(service.user()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
      expect(service.isReviewer()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });

    it('restores the user from the session cookie via /api/auth/me', async () => {
      const user = userWith('user');
      http.get.mockReturnValue(of(user));

      await service.restoreSession();

      expect(http.get).toHaveBeenCalledWith('/api/auth/me');
      expect(service.user()).toEqual(user);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('stays logged out when there is no valid session', async () => {
      await service.restoreSession();

      expect(service.user()).toBeNull();
    });

    it('purges the legacy localStorage token and user', async () => {
      localStorage.setItem('cos.token', 'old-jwt');
      localStorage.setItem('cos.user', '{}');

      await service.restoreSession();

      expect(localStorage.getItem('cos.token')).toBeNull();
      expect(localStorage.getItem('cos.user')).toBeNull();
    });
  });

  describe('register', () => {
    it('registers the user without storing anything in localStorage', () => {
      const result: AuthResult = { user: userWith('user') };
      http.post.mockReturnValue(of(result));

      service.register('user@example.com', 'Test User', 'password123').subscribe();

      expect(http.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'user@example.com',
        displayName: 'Test User',
        password: 'password123',
      });
      expect(service.user()).toEqual(result.user);
      expect(localStorage.length).toBe(0);
    });
  });

  describe('login', () => {
    it('logs the user in without storing anything in localStorage', () => {
      const result: AuthResult = { user: userWith('user') };
      http.post.mockReturnValue(of(result));

      service.login('user@example.com', 'password123').subscribe();

      expect(http.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'user@example.com',
        password: 'password123',
      });
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    it('does not expose any token', () => {
      expect('token' in service).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears the user and asks the server to clear the cookie', () => {
      http.post.mockReturnValue(of({ user: userWith('user') }));
      service.login('user@example.com', 'pw').subscribe();
      http.post.mockReturnValue(of(undefined));

      service.logout().subscribe();

      expect(http.post).toHaveBeenLastCalledWith('/api/auth/logout', {});
      expect(service.user()).toBeNull();
    });

    it('still logs out locally when the request fails', () => {
      http.post.mockReturnValue(of({ user: userWith('user') }));
      service.login('user@example.com', 'pw').subscribe();
      http.post.mockReturnValue(throwError(() => new Error('offline')));

      let completed = false;
      service.logout().subscribe({ complete: () => (completed = true) });

      expect(completed).toBe(true);
      expect(service.user()).toBeNull();
    });
  });

  describe('password reset', () => {
    it('requests a reset link', () => {
      service.forgotPassword('user@example.com').subscribe();
      expect(http.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'user@example.com',
      });
    });

    it('submits the token and new password', () => {
      service.resetPassword('tok', 'newpassword1').subscribe();
      expect(http.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'tok',
        password: 'newpassword1',
      });
    });
  });

  describe('role-based computed signals', () => {
    const loginAs = (role: AuthUser['role']) => {
      http.post.mockReturnValue(of({ user: userWith(role) }));
      service.login(`${role}@example.com`, 'pass').subscribe();
    };

    it('isReviewer returns true for reviewer role', () => {
      loginAs('reviewer');
      expect(service.isReviewer()).toBe(true);
      expect(service.isAdmin()).toBe(false);
    });

    it('isAdmin returns true for admin role', () => {
      loginAs('admin');
      expect(service.isAdmin()).toBe(true);
      expect(service.isReviewer()).toBe(true);
    });

    it('isAdmin returns true for super_admin role', () => {
      loginAs('super_admin');
      expect(service.isAdmin()).toBe(true);
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('role checks return false for regular user', () => {
      loginAs('user');
      expect(service.isReviewer()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });
  });
});
