import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { AuthResult, AuthUser } from './models';

/** Keys from before the session moved to an HttpOnly cookie (LSA-B8). */
const LEGACY_STORAGE_KEYS = ['cos.token', 'cos.user'];

/**
 * The session JWT lives in an HttpOnly cookie that page scripts cannot read,
 * so this service only keeps the (non-secret) user profile in memory and
 * restores it from `/api/auth/me` on startup.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isReviewer = computed(() =>
    ['reviewer', 'admin', 'super_admin'].includes(this._user()?.role ?? ''),
  );
  readonly isAdmin = computed(() => ['admin', 'super_admin'].includes(this._user()?.role ?? ''));
  readonly isSuperAdmin = computed(() => this._user()?.role === 'super_admin');

  constructor(private readonly http: HttpClient) {}

  /** Runs once at app start, before routing, so guards see the real session. */
  restoreSession(): Promise<void> {
    this.purgeLegacyStorage();
    return firstValueFrom(
      this.http.get<AuthUser>('/api/auth/me').pipe(
        catchError(() => of(null)),
        map((user) => this._user.set(user)),
      ),
    );
  }

  /** Re-reads the current user, e.g. after the email address changed. */
  refresh(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>('/api/auth/me').pipe(
      catchError(() => of(null)),
      tap((user) => this._user.set(user)),
    );
  }

  register(
    email: string,
    displayName: string,
    password: string,
    pronouns?: string,
  ): Observable<AuthResult> {
    const body: Record<string, string> = { email, displayName, password };
    if (pronouns) {
      body['pronouns'] = pronouns;
    }
    return this.http
      .post<AuthResult>('/api/auth/register', body)
      .pipe(tap((res) => this._user.set(res.user)));
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<AuthResult>('/api/auth/login', { email, password })
      .pipe(tap((res) => this._user.set(res.user)));
  }

  /** Clears the local state immediately; the server clears the cookie. */
  logout(): Observable<void> {
    this._user.set(null);
    return this.http.post<void>('/api/auth/logout', {}).pipe(catchError(() => of(undefined)));
  }

  /** For when the server already ended the session (e.g. account deletion). */
  clearSession(): void {
    this._user.set(null);
  }

  patchUser(partial: Partial<AuthUser>): void {
    const current = this._user();
    if (!current) return;
    this._user.set({ ...current, ...partial });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', { token, password });
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/verify-email', { token });
  }

  resendVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/resend-verification', {});
  }

  private purgeLegacyStorage(): void {
    try {
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data).
    }
  }
}
