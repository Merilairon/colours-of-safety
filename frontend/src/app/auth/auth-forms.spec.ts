/**
 * LSA-B15 (auth form feedback) and LSA-F1 (password reset) behaviour.
 */
import '@angular/compiler';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { ForgotPasswordComponent } from './forgot-password';
import { ResetPasswordComponent } from './reset-password';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function el<T extends HTMLElement>(fixture: ComponentFixture<unknown>, sel: string): T {
  return (fixture.nativeElement as HTMLElement).querySelector<T>(sel)!;
}

function submit(fixture: ComponentFixture<unknown>): void {
  el<HTMLFormElement>(fixture, 'form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

async function setup<T>(component: Type<T>, fragment: string | null = null) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            fragment,
            queryParamMap: new Map() as unknown,
            data: {},
          },
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}

describe('Login form (LSA-B15)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    ({ fixture, http } = await setup(LoginComponent));
  });

  afterEach(() => {
    http.verify();
    fixture.nativeElement.remove();
  });

  it('marks fields required for assistive tech', () => {
    expect(el(fixture, '#login-email').hasAttribute('required')).toBe(true);
    expect(el(fixture, '#login-password').hasAttribute('required')).toBe(true);
  });

  it('shows visible errors, sets aria-invalid and focuses the first field on empty submit', () => {
    submit(fixture);

    const email = el<HTMLInputElement>(fixture, '#login-email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(el(fixture, '#login-email-error').textContent).toContain('Enter your email');
    expect(el(fixture, '#login-password-error').textContent).toContain('Enter your password');
    expect(document.activeElement).toBe(email);
    http.expectNone('/api/auth/login');
  });

  it('explains an invalid email address', () => {
    (fixture.componentInstance as any).form.controls.email.setValue('nope');
    submit(fixture);

    expect(el(fixture, '#login-email-error').textContent).toContain('valid email');
  });

  it('moves focus to the error message after a failed login', async () => {
    (fixture.componentInstance as any).form.setValue({ email: 'a@b.com', password: 'wrong' });
    submit(fixture);

    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    await flush();

    const error = el(fixture, '[data-form-error]');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Invalid email or password.');
    expect(document.activeElement).toBe(error);
  });

  it('links to the password reset flow (LSA-F1)', () => {
    expect(el(fixture, 'a[href="/forgot-password"]').textContent).toContain('Forgot password?');
  });
});

describe('Register form (LSA-B15)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    ({ fixture, http } = await setup(RegisterComponent));
  });

  afterEach(() => {
    http.verify();
    fixture.nativeElement.remove();
  });

  it('enforces the 8-character password minimum with visible feedback', () => {
    const form = (fixture.componentInstance as any).form;
    form.setValue({ displayName: 'Al', email: 'a@b.com', password: '123', pronouns: '' });
    submit(fixture);

    const password = el(fixture, '#register-password');
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toContain('register-password-error');
    expect(el(fixture, '#register-password-error').textContent).toContain('at least 8');
    expect(document.activeElement).toBe(password);
    http.expectNone('/api/auth/register');
  });

  it('has no duplicate "prefer not to say" pronoun option', () => {
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('#register-pronouns option'),
    ).map((o) => o.textContent!.trim().toLowerCase());

    expect(labels.filter((l) => l.includes('prefer not to say'))).toHaveLength(1);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('links to the privacy policy', () => {
    expect(el(fixture, 'a[href="/privacy"]')).not.toBeNull();
  });
});

describe('Forgot password (LSA-F1)', () => {
  it('shows the same confirmation regardless of whether the account exists', async () => {
    const { fixture, http } = await setup(ForgotPasswordComponent);
    (fixture.componentInstance as any).form.setValue({ email: 'someone@example.com' });
    submit(fixture);

    const req = http.expectOne('/api/auth/forgot-password');
    expect(req.request.body).toEqual({ email: 'someone@example.com' });
    req.flush({ message: 'ok' });
    fixture.detectChanges();

    expect(el(fixture, '[role="status"]').textContent).toContain('If an account exists');
    http.verify();
    fixture.nativeElement.remove();
  });
});

describe('Reset password (LSA-F1)', () => {
  it('reads the token from the URL fragment and removes it from the address bar', async () => {
    const replaceState = vi.spyOn(Location.prototype, 'replaceState');
    const { fixture, http } = await setup(ResetPasswordComponent, 'token=abc123');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(replaceState).toHaveBeenCalled();
    (fixture.componentInstance as any).form.setValue({
      password: 'newpassword1',
      confirm: 'newpassword1',
    });
    submit(fixture);

    const req = http.expectOne('/api/auth/reset-password');
    expect(req.request.body).toEqual({ token: 'abc123', password: 'newpassword1' });
    req.flush({ message: 'ok' });

    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reset: 'ok' } });
    http.verify();
    fixture.nativeElement.remove();
    replaceState.mockRestore();
  });

  it('rejects mismatched passwords before calling the API', async () => {
    const { fixture, http } = await setup(ResetPasswordComponent, 'token=abc123');
    (fixture.componentInstance as any).form.setValue({
      password: 'newpassword1',
      confirm: 'different11',
    });
    submit(fixture);

    expect(el(fixture, '#reset-confirm-error').textContent).toContain("don't match");
    http.expectNone('/api/auth/reset-password');
    fixture.nativeElement.remove();
  });

  it('explains an incomplete link when there is no token', async () => {
    const { fixture } = await setup(ResetPasswordComponent, null);

    expect(el(fixture, '[role="alert"]').textContent).toContain('incomplete');
    expect(el(fixture, 'form')).toBeNull();
    fixture.nativeElement.remove();
  });
});
