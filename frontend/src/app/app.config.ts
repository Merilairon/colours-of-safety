import { provideHttpClient } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { AnalyticsService } from './core/analytics.service';
import { AuthService } from './core/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The session is an HttpOnly cookie sent automatically on same-origin
    // /api requests, so no auth interceptor is needed.
    provideHttpClient(),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    AnalyticsService,
    provideAppInitializer(() => {
      const analytics = inject(AnalyticsService);
      analytics.init();
    }),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
