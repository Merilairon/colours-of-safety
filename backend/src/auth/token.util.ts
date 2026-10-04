import { createHash, randomBytes } from 'crypto';

/** A 256-bit, URL-safe, single-use token for email links. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Email tokens are stored hashed, so a database leak does not hand out live
 * verification, email-change or password-reset links. The tokens carry 256
 * bits of entropy, so an unsalted fast hash is sufficient.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
