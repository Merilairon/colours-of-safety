import { Controller, Get } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Controller()
export class AppController {
  @Get('debug-sentry')
  getError(): void {
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint',
    });
    Sentry.metrics.count('test_counter', 1);
    throw new Error('My first Sentry error!');
  }
}
