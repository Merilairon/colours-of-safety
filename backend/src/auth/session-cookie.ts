import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request } from 'express';

/**
 * The session JWT lives in an HttpOnly cookie so page scripts (and therefore
 * any XSS) can never read it. SameSite=Strict keeps it off cross-site
 * requests, which is our CSRF defence; path=/api keeps it off page loads.
 */
export const SESSION_COOKIE = 'cos_session';

const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses JWT_EXPIRES_IN values such as `7d`, `12h` or `3600` (seconds). */
export function parseDurationMs(value: string | undefined): number {
  const match = /^(\d+)\s*([smhd])?$/.exec((value ?? '').trim());
  if (!match) {
    return 7 * UNIT_MS.d;
  }
  return Number(match[1]) * UNIT_MS[match[2] ?? 's'];
}

export function sessionCookieOptions(config: ConfigService): CookieOptions {
  const secureSetting = config.get<string>('COOKIE_SECURE');
  const secure =
    secureSetting !== undefined
      ? secureSetting === 'true'
      : config.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api',
    maxAge: parseDurationMs(config.get<string>('JWT_EXPIRES_IN', '7d')),
  };
}

/** Options that match the cookie closely enough for the browser to delete it. */
export function clearSessionCookieOptions(
  config: ConfigService,
): CookieOptions {
  const options = sessionCookieOptions(config);
  delete options.maxAge;
  return options;
}

export function sessionTokenFromCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[SESSION_COOKIE] ?? null;
}
