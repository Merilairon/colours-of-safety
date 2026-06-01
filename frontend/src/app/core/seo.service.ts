import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robots?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly baseUrl = 'https://coloursofsafety.com';

  updateSeo(config: SeoConfig): void {
    // Title
    this.title.setTitle(config.title);

    // Standard meta
    this.meta.updateTag({ name: 'description', content: config.description });

    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    if (config.robots) {
      this.meta.updateTag({ name: 'robots', content: config.robots });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: config.ogTitle || config.title });
    this.meta.updateTag({
      property: 'og:description',
      content: config.ogDescription || config.description,
    });
    this.meta.updateTag({ property: 'og:url', content: config.canonicalUrl || this.baseUrl });

    if (config.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: config.ogImage });
    }

    // Twitter
    this.meta.updateTag({ name: 'twitter:title', content: config.ogTitle || config.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: config.ogDescription || config.description,
    });

    // Canonical
    if (config.canonicalUrl) {
      this.updateCanonicalUrl(config.canonicalUrl);
    }
  }

  private updateCanonicalUrl(url: string): void {
    const canonicalUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', canonicalUrl);
  }

  setNoIndex(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }
}
