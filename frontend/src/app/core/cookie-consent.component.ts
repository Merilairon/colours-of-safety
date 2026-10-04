import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { readConsent, writeConsent } from './consent';

@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink],
  template: `
    @if (!hasConsented()) {
      <section class="cookie-consent" aria-label="Privacy choices">
        <div class="cookie-content">
          <p>
            We keep you logged in with one essential cookie and save your settings in this browser.
            With your OK we also use Google Analytics and Sentry session replay to improve the site.
            <a routerLink="/privacy" class="cookie-link">Learn more</a>
          </p>
          <div class="cookie-actions">
            <button type="button" class="cookie-btn secondary" (click)="reject()">Reject</button>
            <button type="button" class="cookie-btn primary" (click)="accept()">Accept</button>
          </div>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .cookie-consent {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #2c3e50;
        color: white;
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }

      .cookie-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .cookie-content p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .cookie-link {
        color: #a5d8ff;
        text-decoration: underline;
      }

      .cookie-link:focus-visible,
      .cookie-btn:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }

      .cookie-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .cookie-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .cookie-btn:hover {
        transform: translateY(-1px);
      }

      .cookie-btn.secondary {
        background: #636e72;
        color: white;
      }

      .cookie-btn.primary {
        background: #c2185b;
        color: white;
      }

      @media (max-width: 768px) {
        .cookie-content {
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
        }

        .cookie-content p {
          font-size: 0.8rem;
        }

        .cookie-actions .cookie-btn {
          flex: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .cookie-btn {
          transition: none;
        }

        .cookie-btn:hover {
          transform: none;
        }
      }
    `,
  ],
  standalone: true,
})
export class CookieConsentComponent {
  protected readonly hasConsented = signal<boolean>(readConsent() !== null);

  protected accept(): void {
    const wasAlreadyConsented = readConsent() === 'accepted';
    writeConsent(true);
    this.hasConsented.set(true);
    // Analytics and replay are configured at startup, so a reload turns them on.
    if (!wasAlreadyConsented && typeof location !== 'undefined') {
      location.reload();
    }
  }

  protected reject(): void {
    writeConsent(false);
    this.hasConsented.set(true);
  }
}
