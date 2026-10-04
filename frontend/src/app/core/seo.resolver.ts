import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { SeoService } from './seo.service';
import { inject } from '@angular/core';

interface SeoData {
  title: string;
  description: string;
  robots?: string;
}

const BASE_URL = 'https://coloursofsafety.com';

/** Absolute canonical URL for a route, e.g. `https://coloursofsafety.com/place/<id>`. */
export function canonicalUrlFor(route: ActivatedRouteSnapshot): string {
  const path = route.pathFromRoot
    .flatMap((r) => r.url)
    .map((segment) => segment.path)
    .join('/');
  return `${BASE_URL}/${path}`;
}

export const seoResolver: ResolveFn<void> = (route: ActivatedRouteSnapshot) => {
  const seo = inject(SeoService);
  const seoData = route.data as SeoData;

  if (seoData) {
    seo.updateSeo({
      title: seoData.title,
      description: seoData.description,
      robots: seoData.robots || 'index,follow',
      canonicalUrl: canonicalUrlFor(route),
    });
  }
};
