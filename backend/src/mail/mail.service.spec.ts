import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const configWith = (values: Record<string, string>) =>
  ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  }) as unknown as ConfigService;

describe('MailService', () => {
  let sendMail: jest.Mock<Promise<void>, [Record<string, string>]>;
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    sendMail = jest.fn<Promise<void>, [Record<string, string>]>(() =>
      Promise.resolve(),
    );
    (createTransport as jest.Mock).mockReturnValue({ sendMail });
    logSpies = (['log', 'warn', 'error'] as const).map((m) =>
      jest.spyOn(Logger.prototype, m).mockImplementation(() => undefined),
    );
  });

  afterEach(() => logSpies.forEach((spy) => spy.mockRestore()));

  const loggedText = () =>
    logSpies
      .flatMap((spy) => (spy.mock.calls as unknown[][]).flat())
      .join('\n');

  it('sends through SMTP with the token in the link fragment', async () => {
    const mail = new MailService(
      configWith({ SMTP_HOST: 'smtp.example.com', APP_URL: 'https://x.test/' }),
    );

    await mail.sendPasswordResetEmail('a@b.com', 'Alice', 'tok123');

    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('a@b.com');
    expect(message.text).toContain(
      'https://x.test/reset-password#token=tok123',
    );
  });

  it('escapes user-controlled text in the HTML body', async () => {
    const mail = new MailService(configWith({ SMTP_HOST: 'smtp.example.com' }));

    await mail.sendVerificationEmail('a@b.com', '<img src=x>', 't');

    const { html } = sendMail.mock.calls[0][0];
    expect(html).not.toContain('<img src=x>');
    expect(html).toContain('&lt;img src=x&gt;');
  });

  it('never logs the token or recipient when sending fails', async () => {
    sendMail.mockRejectedValueOnce(new Error('connection refused'));
    const mail = new MailService(configWith({ SMTP_HOST: 'smtp.example.com' }));

    const sent = await mail.sendPasswordResetEmail(
      'a@b.com',
      'Al',
      'secret-tok',
    );

    expect(sent).toBe(false);
    expect(loggedText()).not.toContain('secret-tok');
    expect(loggedText()).not.toContain('a@b.com');
  });

  it('drops mail without logging secrets when SMTP is not configured', async () => {
    const mail = new MailService(configWith({}));

    const sent = await mail.sendVerificationEmail(
      'a@b.com',
      'Al',
      'secret-tok',
    );

    expect(mail.enabled).toBe(false);
    expect(sent).toBe(false);
    expect(loggedText()).not.toContain('secret-tok');
    expect(loggedText()).not.toContain('a@b.com');
  });

  it('refuses the log transport in production', async () => {
    const mail = new MailService(
      configWith({ MAIL_TRANSPORT: 'log', NODE_ENV: 'production' }),
    );

    await mail.sendVerificationEmail('a@b.com', 'Al', 'secret-tok');

    expect(mail.enabled).toBe(false);
    expect(loggedText()).not.toContain('secret-tok');
  });
});
