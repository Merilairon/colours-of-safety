import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ProfileService } from '../core/profile.service';
import { takeFragmentToken } from './form-feedback';

type Mode = 'verify' | 'email-change';

const COPY: Record<Mode, { title: string; working: string; done: string; failed: string }> = {
  verify: {
    title: 'Confirm your email',
    working: 'Confirming your email address…',
    done: 'Thanks, your email address is confirmed.',
    failed:
      'This confirmation link is invalid or has expired. Log in and request a new one from your profile.',
  },
  'email-change': {
    title: 'Confirm your new email',
    working: 'Confirming your new email address…',
    done: 'Your email address has been updated. Use it the next time you log in.',
    failed:
      'This confirmation link is invalid or has expired. Request the email change again from your profile.',
  },
};

/** Landing page for the links in verification and email-change emails. */
@Component({
  selector: 'app-email-link',
  imports: [RouterLink],
  template: `
    <div class="auth-card">
      <h1>{{ copy.title }}</h1>
      @switch (state()) {
        @case ('working') {
          <p class="sub" role="status">{{ copy.working }}</p>
        }
        @case ('done') {
          <p class="notice" role="status">{{ copy.done }}</p>
          <p class="switch"><a routerLink="/">Go to the map</a></p>
        }
        @case ('failed') {
          <p class="error" role="alert">{{ copy.failed }}</p>
          <p class="switch">
            <a [routerLink]="auth.isLoggedIn() ? '/profile' : '/login'">
              {{ auth.isLoggedIn() ? 'Go to your profile' : 'Log in' }}
            </a>
          </p>
        }
      }
    </div>
  `,
  styleUrl: './auth.scss',
})
export class EmailLinkComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  private readonly mode: Mode = inject(ActivatedRoute).snapshot.data['mode'] ?? 'verify';
  private readonly token = takeFragmentToken();

  protected readonly copy = COPY[this.mode];
  protected readonly state = signal<'working' | 'done' | 'failed'>('working');

  ngOnInit(): void {
    if (!this.token) {
      this.state.set('failed');
      return;
    }
    const request: Observable<unknown> =
      this.mode === 'verify'
        ? this.auth.verifyEmail(this.token)
        : this.profile.confirmEmailChange({ token: this.token });
    request.subscribe({
      next: () => {
        this.state.set('done');
        if (this.auth.isLoggedIn()) {
          this.auth.refresh().subscribe();
        }
      },
      error: () => this.state.set('failed'),
    });
  }
}
