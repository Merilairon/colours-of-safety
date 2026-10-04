/**
 * The visitor's analytics choice, kept in localStorage under a key that
 * predates this helper. `null` means they have not answered the banner yet.
 */
const CONSENT_KEY = 'cookie-consent';

export type ConsentChoice = 'accepted' | 'rejected' | null;

export function readConsent(): ConsentChoice {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'true' ? 'accepted' : value === 'false' ? 'rejected' : null;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === 'accepted';
}

export function writeConsent(accepted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, String(accepted));
  } catch {
    // Without storage the banner simply asks again next visit.
  }
}
