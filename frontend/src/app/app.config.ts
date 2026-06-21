import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { authInterceptor } from './core/auth.interceptor';
import { AnalyticsService } from './core/analytics.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
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
