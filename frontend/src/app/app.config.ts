import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
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
  ],
};
