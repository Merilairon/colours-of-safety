import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

/** Sends a logged-out visitor to /login, remembering where they wanted to go. */
function loginRedirect(router: Router, state: RouterStateSnapshot | undefined): UrlTree {
  const returnUrl = state?.url;
  return returnUrl && returnUrl !== '/'
    ? router.createUrlTree(['/login'], { queryParams: { returnUrl } })
    : router.createUrlTree(['/login']);
}

/**
 * Only same-origin, in-app paths are honoured so a crafted `?returnUrl=` link
 * cannot bounce users to another site after they log in.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  return loginRedirect(router, state);
};

export const reviewerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isReviewer()) {
    return true;
  }
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : loginRedirect(router, state);
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) {
    return true;
  }
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : loginRedirect(router, state);
};
