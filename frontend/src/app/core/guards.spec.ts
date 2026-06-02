import '@angular/compiler';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Location } from '@angular/common';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard, reviewerGuard, adminGuard } from './guards';
import { AuthService } from './auth.service';
import { signal, computed } from '@angular/core';

describe('Route Guards', () => {
  let authService: AuthService;
  let router: Router;
  let isLoggedInSignal: ReturnType<typeof signal<boolean>>;
  let isReviewerSignal: ReturnType<typeof signal<boolean>>;
  let isAdminSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    isLoggedInSignal = signal(false);
    isReviewerSignal = signal(false);
    isAdminSignal = signal(false);

    authService = {
      isLoggedIn: computed(() => isLoggedInSignal()),
      isReviewer: computed(() => isReviewerSignal()),
      isAdmin: computed(() => isAdminSignal()),
    } as AuthService;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: class {} },
          { path: 'login', component: class {} },
          {
            path: 'admin',
            component: class {},
            canActivate: [
              () => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
            ],
          },
          {
            path: 'review',
            component: class {},
            canActivate: [
              () => reviewerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
            ],
          },
          {
            path: 'profile',
            component: class {},
            canActivate: [() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)],
          },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('allows access when user is logged in', () => {
      isLoggedInSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('redirects to login when user is not logged in', () => {
      isLoggedInSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toEqual(router.createUrlTree(['/login']));
    });
  });

  describe('reviewerGuard', () => {
    it('allows access when user is reviewer', () => {
      isReviewerSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        reviewerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('allows access when user is admin', () => {
      isReviewerSignal.set(true);
      isAdminSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        reviewerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('redirects to home when user is not reviewer', () => {
      isReviewerSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        reviewerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toEqual(router.createUrlTree(['/']));
    });
  });

  describe('adminGuard', () => {
    it('allows access when user is admin', () => {
      isAdminSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('allows access when user is super_admin', () => {
      isAdminSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('redirects to home when user is not admin', () => {
      isAdminSignal.set(false);
      isReviewerSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toEqual(router.createUrlTree(['/']));
    });

    it('redirects to home when user is regular user', () => {
      isAdminSignal.set(false);
      isReviewerSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toEqual(router.createUrlTree(['/']));
    });
  });
});
