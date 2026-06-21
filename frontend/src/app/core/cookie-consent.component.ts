import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-cookie-consent',
  template: `
    @if (!hasConsented()) {
      <div class="cookie-consent" role="dialog" aria-live="polite">
        <div class="cookie-content">
          <p>
            We use cookies for essential features and analytics. Your privacy matters.
            <a href="/privacy" class="cookie-link">Learn more</a>
          </p>
          <div class="cookie-actions">
            <button class="cookie-btn secondary" (click)="reject()">Reject</button>
            <button class="cookie-btn primary" (click)="accept()">Accept</button>
          </div>
        </div>
      </div>
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
        color: #74b9ff;
        text-decoration: none;
      }

      .cookie-link:hover {
        text-decoration: underline;
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
        background: #e84393;
        color: white;
      }

      @media (max-width: 768px) {
        .cookie-content {
          flex-direction: column;
          text-align: center;
        }

        .cookie-actions {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  standalone: true,
})
export class CookieConsentComponent {
  protected readonly hasConsented = signal<boolean>(false);

  constructor() {
    this.hasConsented.set(localStorage.getItem('cookie-consent') === 'true');
  }

  protected accept(): void {
    const wasAlreadyConsented = localStorage.getItem('cookie-consent') === 'true';
    localStorage.setItem('cookie-consent', 'true');
    this.hasConsented.set(true);
    if (!wasAlreadyConsented && typeof location !== 'undefined') {
      location.reload();
    }
  }

  protected reject(): void {
    localStorage.setItem('cookie-consent', 'false');
    this.hasConsented.set(true);
  }
}
