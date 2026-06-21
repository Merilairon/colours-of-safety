import './leaflet-setup';
import * as Sentry from '@sentry/angular';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const hasConsent =
  typeof localStorage !== 'undefined' && localStorage.getItem('cookie-consent') === 'true';

Sentry.init({
  dsn: 'https://40b930115f72134dc145f82ea4208894@o4511603599540224.ingest.de.sentry.io/4511603666124880',
  dataCollection: {
    userInfo: hasConsent,
    httpBodies: hasConsent
      ? ['incomingRequest', 'outgoingRequest', 'incomingResponse', 'outgoingResponse']
      : [],
  },
  integrations: hasConsent
    ? [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]
    : [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: hasConsent ? 0.1 : 0,
  replaysOnErrorSampleRate: hasConsent ? 1.0 : 0,
  enableLogs: true,
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
