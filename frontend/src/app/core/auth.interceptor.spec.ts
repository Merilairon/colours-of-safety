import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    tokenSignal = signal<string | null>(null);

    const mockAuthService = {
      get token() {
        return tokenSignal();
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization header when token exists', () => {
    tokenSignal.set('test-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('does not add header when no token', () => {
    tokenSignal.set(null);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('passes through request unchanged when authenticated', () => {
    tokenSignal.set('my-auth-token');

    http.post('/api/data', { foo: 'bar' }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ foo: 'bar' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-auth-token');
    req.flush({});
  });
});
