import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

type TransportMode = 'smtp' | 'log' | 'disabled';

/**
 * Transactional email over SMTP, so any provider (Postmark, Resend, SES,
 * Brevo, Mailgun, …) works through configuration alone.
 *
 * Never log message bodies or recipients: bodies carry single-use tokens that
 * are equivalent to account access. The only exception is `MAIL_TRANSPORT=log`,
 * an explicit opt-in for local development that is refused in production.
 *
 * Sending never throws. A failed email must not fail the request that caused
 * it, and timing must not reveal whether an account exists (password reset).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mode: TransportMode;
  private readonly transporter: Transporter | null = null;
  private readonly from: string;
  readonly appUrl: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>(
      'MAIL_FROM',
      'Colours of Safety <no-reply@coloursofsafety.com>',
    );
    this.appUrl = config
      .get<string>('APP_URL', 'https://coloursofsafety.com')
      .replace(/\/+$/, '');

    const isProduction = config.get<string>('NODE_ENV') === 'production';
    const requested = config.get<string>('MAIL_TRANSPORT');
    const host = config.get<string>('SMTP_HOST');

    if (requested === 'log' && !isProduction) {
      this.mode = 'log';
    } else if (host) {
      this.mode = 'smtp';
      const port = Number(config.get<string>('SMTP_PORT', '587'));
      const user = config.get<string>('SMTP_USER');
      this.transporter = createTransport({
        host,
        port,
        // Port 465 is implicit TLS; other ports upgrade via STARTTLS.
        secure:
          config.get<string>('SMTP_SECURE', String(port === 465)) === 'true',
        requireTLS: port !== 465,
        auth: user
          ? { user, pass: config.get<string>('SMTP_PASS', '') }
          : undefined,
      });
    } else {
      this.mode = 'disabled';
      this.logger.error(
        'SMTP_HOST is not configured: verification, email-change and password-reset emails will NOT be sent.',
      );
    }
  }

  get enabled(): boolean {
    return this.mode !== 'disabled';
  }

  sendVerificationEmail(to: string, displayName: string, token: string) {
    const link = this.link('/verify-email', token);
    return this.send({
      to,
      subject: 'Confirm your email address',
      ...this.render(
        displayName,
        [
          'Thanks for joining Colours of Safety. Please confirm your email address.',
        ],
        { label: 'Confirm email address', href: link },
        'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
      ),
    });
  }

  sendEmailChangeEmail(to: string, displayName: string, token: string) {
    const link = this.link('/confirm-email', token);
    return this.send({
      to,
      subject: 'Confirm your new email address',
      ...this.render(
        displayName,
        ['You asked to use this address for your Colours of Safety account.'],
        { label: 'Confirm new email address', href: link },
        'This link expires in 24 hours. If you did not request this, you can ignore this email.',
      ),
    });
  }

  sendPasswordResetEmail(to: string, displayName: string, token: string) {
    const link = this.link('/reset-password', token);
    return this.send({
      to,
      subject: 'Reset your password',
      ...this.render(
        displayName,
        [
          'Someone asked to reset the password for your Colours of Safety account.',
        ],
        { label: 'Choose a new password', href: link },
        'This link expires in 1 hour and can be used once. If you did not ask for this, you can ignore this email; your password will not change.',
      ),
    });
  }

  /** Security notice to the account's address after a sensitive change. */
  sendSecurityNotice(to: string, displayName: string, change: string) {
    return this.send({
      to,
      subject: 'Your account was changed',
      ...this.render(
        displayName,
        [`${change} on your Colours of Safety account.`],
        {
          label: 'Reset your password',
          href: `${this.appUrl}/forgot-password`,
        },
        'If this was you, no action is needed. If it was not, reset your password now.',
      ),
    });
  }

  async send(message: MailMessage): Promise<boolean> {
    if (this.mode === 'log') {
      this.logger.log(
        `[MAIL_TRANSPORT=log] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
      );
      return true;
    }
    if (!this.transporter) {
      this.logger.warn(`Email not sent (no transport): "${message.subject}"`);
      return false;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      return true;
    } catch (err) {
      // Log the failure class only: the message body contains a token.
      const reason = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Email "${message.subject}" failed: ${reason}`);
      return false;
    }
  }

  /**
   * Tokens go in the URL fragment, not the query string: fragments are never
   * sent to servers, so they stay out of nginx/Cloudflare logs and Referer.
   */
  private link(path: string, token: string): string {
    return `${this.appUrl}${path}#token=${encodeURIComponent(token)}`;
  }

  private render(
    displayName: string,
    paragraphs: string[],
    action: { label: string; href: string },
    footer: string,
  ): Pick<MailMessage, 'text' | 'html'> {
    const text = [
      `Hi ${displayName},`,
      '',
      ...paragraphs,
      '',
      `${action.label}: ${action.href}`,
      '',
      footer,
      '',
      '— Colours of Safety',
    ].join('\n');

    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#1f2130;line-height:1.5;max-width:520px;margin:0 auto;padding:24px">
<p>Hi ${escapeHtml(displayName)},</p>
${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}
<p><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#c2185b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(action.label)}</a></p>
<p style="font-size:13px;color:#555">Or paste this link into your browser:<br>${escapeHtml(action.href)}</p>
<p style="font-size:13px;color:#555">${escapeHtml(footer)}</p>
<p>— Colours of Safety</p>
</body></html>`;

    return { text, html };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
