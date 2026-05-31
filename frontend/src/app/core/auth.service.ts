import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResult, AuthUser } from './models';

const TOKEN_KEY = 'cos.token';
const USER_KEY = 'cos.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.restoreUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isReviewer = computed(() => this._user()?.role === 'reviewer');

  constructor(private readonly http: HttpClient) {}

  register(
    email: string,
    displayName: string,
    password: string,
  ): Observable<AuthResult> {
    return this.http
      .post<AuthResult>('/api/auth/register', { email, displayName, password })
      .pipe(tap((res) => this.persist(res)));
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<AuthResult>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(res: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private restoreUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
