import { Component, inject, isDevMode, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { AuthService } from './core/auth.service';
import { CookieConsentComponent } from './core/cookie-consent.component';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CookieConsentComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isReviewer = this.auth.isReviewer;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly isSuperAdmin = this.auth.isSuperAdmin;
  protected readonly navOpen = signal(false);
  protected readonly isHighContrast = this.theme.isHighContrast;
  protected readonly showSentryTest = isDevMode();

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  toggleTheme(): void {
    this.theme.toggleHighContrast();
  }

  throwTestError(): void {
    Sentry.logger.info(Sentry.logger.fmt`User ${'sentry-test'} triggered test error button`, {
      action: 'test_error_button_click',
    });
    (Sentry as any).metrics?.count('test_counter', 1);
    throw new Error('Sentry Test Error');
  }
}
