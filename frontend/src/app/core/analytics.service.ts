import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly gaId = 'G-0W8XWVR4LF';

  init(): void {
    this.loadGtag();
    this.trackPageViews();
  }

  private loadGtag(): void {
    if (typeof window === 'undefined') return;

    // Prevent duplicate loading
    if (window.gtag) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.gaId, { send_page_view: false });

    // Load script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);
  }

  private trackPageViews(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        window.gtag?.('event', 'page_view', {
          page_path: event.urlAfterRedirects,
          page_location: window.location.href,
          page_title: document.title,
        });
      });
  }

  // Custom event tracking
  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    window.gtag?.('event', eventName, params);
  }

  // Track specific user actions
  trackPlaceSubmission(placeName: string): void {
    this.trackEvent('place_submitted', { place_name: placeName });
  }

  trackDistrictSubmission(districtName: string): void {
    this.trackEvent('district_submitted', { district_name: districtName });
  }

  trackReviewAction(action: 'approved' | 'rejected', itemType: 'poi' | 'district'): void {
    this.trackEvent('review_action', { action, item_type: itemType });
  }

  trackRegistration(method: 'email'): void {
    this.trackEvent('sign_up', { method });
  }
}
