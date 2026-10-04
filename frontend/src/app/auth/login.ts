import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/auth.service';
import { safeReturnUrl } from '../core/guards';
import { FormFeedback } from './form-feedback';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './auth.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  /** Set when arriving from a successful password reset. */
  protected readonly notice = signal<string | null>(
    this.route.snapshot.queryParamMap.get('reset') === 'ok'
      ? 'Your password was reset. Log in with your new password.'
      : null,
  );

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  protected readonly feedback = new FormFeedback(this.form);

  submit(): void {
    if (this.submitting() || !this.feedback.validate()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl(
          safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(
          err.status === 401
            ? 'Invalid email or password.'
            : 'Something went wrong. Please try again.',
        );
        this.feedback.focusError();
      },
    });
  }
}
