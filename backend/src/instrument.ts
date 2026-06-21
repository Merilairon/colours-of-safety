import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://37ba4bf9ab57049803202e33b356d7b6@o4511603599540224.ingest.de.sentry.io/4511603697188944',
  integrations: [nodeProfilingIntegration()],
  enableLogs: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  dataCollection: {
    userInfo: true,
    httpBodies: [
      'incomingRequest',
      'outgoingRequest',
      'incomingResponse',
      'outgoingResponse',
    ],
  },
});
