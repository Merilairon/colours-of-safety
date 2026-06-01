import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { SeoService } from './seo.service';
import { inject } from '@angular/core';

interface SeoData {
  title: string;
  description: string;
  robots?: string;
}

export const seoResolver: ResolveFn<void> = (route: ActivatedRouteSnapshot) => {
  const seo = inject(SeoService);
  const seoData = route.data as SeoData;

  if (seoData) {
    seo.updateSeo({
      title: seoData.title,
      description: seoData.description,
      robots: seoData.robots || 'index,follow',
      canonicalUrl: `https://colours-of-safety.org${route.url.join('/')}`,
    });
  }
};
