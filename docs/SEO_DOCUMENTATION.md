# SEO Documentation: Colours of Safety

> **Project:** Colours of Safety - Community map for queer-friendly places  
> **Tech Stack:** Angular 21 (SPA), NestJS, PostgreSQL/PostGIS  
> **Date:** June 2026  
> **SEO Specialist:** Documented for implementation

---

## 1. Executive Summary

**Current SEO Status:** Minimal baseline - single-page app with basic title only.  
**Priority:** High - Community-driven platform needs discoverability for LGBTQIA+ users seeking safe spaces.

**Critical Issues:**
- No meta descriptions
- No Open Graph / Twitter Cards
- No structured data
- No robots.txt or sitemap
- Client-side rendered (CSR) only - search engines may not index dynamic content
- No canonical URLs
- No hreflang for international users

---

## 2. Keyword Strategy

### Primary Keywords
| Keyword | Intent | Priority |
|---------|--------|----------|
| queer friendly places | Informational | High |
| LGBTQ safe spaces | Informational | High |
| gay friendly map | Navigational | High |
| safe queer spaces near me | Local | High |
| LGBTQ friendly bars | Commercial | Medium |
| queer community resources | Informational | Medium |

### Long-Tail Keywords
- "trans friendly cafes in [city]"
- "LGBTQ safe districts [location]"
- "queer welcoming venues map"
- "safe spaces for LGBTQ travelers"
- "community moderated queer map"

### Brand Keywords
- "Colours of Safety"
- "colours-of-safety.org"

---

## 3. Technical SEO Requirements

### 3.1 Meta Tags (index.html)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Colours of Safety | Find Queer-Friendly Safe Spaces Near You</title>
  <meta name="description" content="Community-driven map of LGBTQIA+ friendly places and safe districts. Browse, submit, and discover queer-welcoming venues, bars, cafes, and community spaces.">
  <meta name="keywords" content="queer friendly, LGBTQ safe spaces, gay friendly map, trans friendly places, safe queer venues">
  <meta name="author" content="Colours of Safety Community">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://colours-of-safety.org/">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Colours of Safety | Find Queer-Friendly Safe Spaces">
  <meta property="og:description" content="Community-driven map of LGBTQIA+ friendly places. Discover and share safe spaces worldwide.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://colours-of-safety.org/">
  <meta property="og:image" content="https://colours-of-safety.org/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Colours of Safety">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Colours of Safety | Queer-Friendly Safe Spaces Map">
  <meta name="twitter:description" content="Discover LGBTQIA+ friendly places and safe districts in your area. Community-moderated for accuracy.">
  <meta name="twitter:image" content="https://colours-of-safety.org/assets/og-image.jpg">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  
  <!-- Theme Color -->
  <meta name="theme-color" content="#e84393">
</head>
```

### 3.2 robots.txt

Create `/frontend/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /mine
Disallow: /review
Disallow: /api/

Sitemap: https://colours-of-safety.org/sitemap.xml

# Crawl-delay for rate limiting
Crawl-delay: 1
```

### 3.3 sitemap.xml

Create `/frontend/public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://colours-of-safety.org/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://colours-of-safety.org/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://colours-of-safety.org/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

**Note:** Dynamic POI/district pages not yet implemented. Future enhancement: `/place/:id` and `/district/:id` routes with individual sitemap entries.

---

## 4. Structured Data (JSON-LD)

### 4.1 Organization Schema

Add to homepage via Angular Meta service or static HTML:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Colours of Safety",
  "url": "https://colours-of-safety.org",
  "logo": "https://colours-of-safety.org/assets/logo.png",
  "description": "Community-driven map platform for LGBTQIA+ safe spaces",
  "sameAs": [
    "https://github.com/Merilairon/colours-of-safety"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "community support",
    "availableLanguage": ["English"]
  }
}
```

### 4.2 WebApplication Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Colours of Safety",
  "applicationCategory": "TravelApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Interactive map of queer-friendly places",
    "Community moderation system",
    "Safety ratings and reviews",
    "District boundary mapping"
  ]
}
```

### 4.3 Place Schema (Future: Per-POI Pages)

When individual place pages are implemented:

```json
{
  "@context": "https://schema.org",
  "@type": "Place",
  "name": "[POI Name]",
  "description": "[Description]",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[lat]",
    "longitude": "[lng]"
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "safetyRating",
      "value": "[1-5]"
    },
    {
      "@type": "PropertyValue", 
      "name": "queerFriendly",
      "value": "true"
    }
  ]
}
```

---

## 5. Route-Level SEO Configuration

### Route Meta Data Map

| Route | Title | Description | Robots | Priority |
|-------|-------|-------------|--------|----------|
| `/` | Colours of Safety \| Find Queer-Friendly Safe Spaces | Community-driven map of LGBTQIA+ friendly places and safe districts. Browse approved safe spaces worldwide. | index,follow | 1.0 |
| `/login` | Login \| Colours of Safety | Sign in to submit queer-friendly places and track your contributions. | index,follow | 0.5 |
| `/register` | Join \| Colours of Safety | Create an account to contribute safe space locations to our community map. | index,follow | 0.5 |
| `/mine` | My Submissions \| Colours of Safety | Track your submitted queer-friendly places and review status. | noindex,nofollow | 0.0 |
| `/review` | Review Queue \| Colours of Safety | Moderator review queue for community submissions. | noindex,nofollow | 0.0 |
| `/**` | Page Not Found \| Colours of Safety | The requested page could not be found. | noindex | 0.0 |

---

## 6. Angular SEO Implementation Guide

### 6.1 Install Angular SSR (Critical)

Angular CSR apps have poor SEO. Implement SSR or prerendering:

```bash
cd /home/baetensjan/Projects/colours-of-safety/frontend
ng add @angular/ssr
```

### 6.2 Dynamic Meta Service

Create `src/app/core/seo.service.ts`:

```typescript
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
  private readonly baseUrl = 'https://colours-of-safety.org';

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
    this.meta.updateTag({ property: 'og:description', content: config.ogDescription || config.description });
    this.meta.updateTag({ property: 'og:url', content: config.canonicalUrl || this.baseUrl });
    
    if (config.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: config.ogImage });
    }
    
    // Twitter
    this.meta.updateTag({ name: 'twitter:title', content: config.ogTitle || config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.ogDescription || config.description });
    
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
```

### 6.3 Route Resolver for SEO

Create `src/app/core/seo.resolver.ts`:

```typescript
import { ResolveFn } from '@angular/router';
import { SeoService } from './seo.service';
import { inject } from '@angular/core';

interface SeoData {
  title: string;
  description: string;
  robots?: string;
}

export const seoResolver: ResolveFn<void> = (route) => {
  const seo = inject(SeoService);
  const seoData = route.data as SeoData;
  
  if (seoData) {
    seo.updateSeo({
      title: seoData.title,
      description: seoData.description,
      robots: seoData.robots || 'index,follow',
      canonicalUrl: `https://colours-of-safety.org${route.url.join('/')}`
    });
  }
};
```

### 6.4 Update Routes with SEO Data

```typescript
import { Routes } from '@angular/router';
import { authGuard, reviewerGuard } from './core/guards';
import { seoResolver } from './core/seo.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./map/map').then((m) => m.MapComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Colours of Safety | Find Queer-Friendly Safe Spaces',
      description: 'Community-driven map of LGBTQIA+ friendly places and safe districts. Browse approved safe spaces worldwide.',
      keywords: 'queer friendly, LGBTQ safe spaces, gay friendly map, trans friendly places'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then((m) => m.LoginComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Login | Colours of Safety',
      description: 'Sign in to submit queer-friendly places and track your contributions.'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register').then((m) => m.RegisterComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Join | Colours of Safety',
      description: 'Create an account to contribute safe space locations to our community map.'
    }
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () => import('./submissions/my-submissions').then((m) => m.MySubmissionsComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'My Submissions | Colours of Safety',
      description: 'Track your submitted queer-friendly places and review status.',
      robots: 'noindex,nofollow'
    }
  },
  {
    path: 'review',
    canActivate: [reviewerGuard],
    loadComponent: () => import('./review/review').then((m) => m.ReviewComponent),
    resolve: { seo: seoResolver },
    data: {
      title: 'Review Queue | Colours of Safety',
      description: 'Moderator review queue for community submissions.',
      robots: 'noindex,nofollow'
    }
  },
  { path: '**', redirectTo: '' }
];
```

---

## 7. Content SEO Strategy

### 7.1 On-Page Content Recommendations

**Map Page (`/`)** - Currently minimal. Add:
- H1: "Find Queer-Friendly Safe Spaces Near You"
- Intro paragraph (2-3 sentences) with primary keywords
- Feature highlights with H2 sections:
  - "Community-Moderated Safety Ratings"
  - "Map LGBTQ+ Friendly Bars, Cafes, and Venues"
  - "Submit Safe Spaces in Your Area"
- FAQ section (structured data ready)

**Login/Register Pages** - Add:
- Value proposition text (why join?)
- Community stats (if available): "X places marked", "Y cities covered"

### 7.2 Accessibility (SEO + A11y)

- Add `aria-label` to map controls
- Ensure color contrast meets WCAG 2.1 AA (safety rating colors)
- Add `alt` text to all icons/images
- Keyboard navigation support for map interactions

---

## 8. Performance SEO

### Core Web Vitals Targets

| Metric | Target | Current Assessment |
|--------|--------|-------------------|
| LCP (Largest Contentful Paint) | < 2.5s | Map tiles may delay - lazy load below fold |
| INP (Interaction to Next Paint) | < 200ms | OK - minimal JS on initial load |
| CLS (Cumulative Layout Shift) | < 0.1 | OK - fixed map container |
| TTFB (Time to First Byte) | < 800ms | SSR will improve significantly |

### Recommendations

1. **Lazy load Leaflet** - Defer map library loading
2. **Preconnect to tile server**:
   ```html
   <link rel="preconnect" href="https://tile.openstreetmap.org">
   ```
3. **Optimize favicon** - Currently 15KB, use SVG if possible
4. **Add resource hints** for API endpoints

---

## 9. Local SEO Considerations

### Geographic Targeting

Current default: Brussels `[50.8503, 4.3517]`

**Recommendations:**
- Detect user location for initial map center (with permission)
- Add geo meta tags for regional pages (future feature)
- Encourage location-specific keywords in submissions

### Google Business Profile

Not applicable (no physical location), but consider:
- Create as "Online Service" category
- Use "LGBTQ+ Service" additional category

---

## 10. Monitoring & Analytics

### Required Setup

1. **Google Search Console**
   - Verify domain ownership
   - Submit sitemap.xml
   - Monitor indexing status

2. **Google Analytics 4**
   - Install gtag.js or use Angular GA4 package
   - Track events: submission created, review approved, signup

3. **Bing Webmaster Tools**
   - Additional search visibility

### Key SEO Metrics to Track

| Metric | Tool | Target |
|--------|------|--------|
| Indexed pages | GSC | 3+ pages |
| Average position | GSC | Top 20 for brand terms |
| Organic clicks | GSC | Growth month-over-month |
| Bounce rate | GA4 | < 50% |
| Pages per session | GA4 | > 2 |

---

## 11. Implementation Priority

### Phase 1: Critical (Week 1)
- [ ] Update `index.html` with full meta tags (Section 3.1)
- [ ] Create `robots.txt` (Section 3.2)
- [ ] Create `sitemap.xml` (Section 3.3)
- [ ] Add Open Graph image asset (1200x630px)

### Phase 2: High Impact (Week 2)
- [ ] Install Angular SSR (`ng add @angular/ssr`)
- [ ] Implement SeoService (Section 6.2)
- [ ] Add route-level SEO data (Section 6.4)
- [ ] Add JSON-LD structured data (Section 4)

### Phase 3: Optimization (Week 3-4)
- [ ] Performance audit and fixes (Section 8)
- [ ] Content enhancements (Section 7.1)
- [ ] Google Search Console setup
- [ ] Analytics implementation

---

## 12. Assets Checklist

| Asset | Size | Purpose | Status |
|-------|------|---------|--------|
| `og-image.jpg` | 1200x630px | Social sharing | Missing |
| `logo.png` | 512x512px | Schema.org | Missing |
| `apple-touch-icon.png` | 180x180px | iOS bookmarks | Missing |
| `favicon.svg` | Vector | Modern browsers | Missing |
| `favicon.ico` | 32x32px | Legacy | Exists |

---

## 13. Security & Privacy (SEO Impact)

- Ensure HTTPS (already configured via Cloudflare Tunnel)
- Add HSTS headers
- Cookie consent for analytics (GDPR compliance)
- Privacy policy page (link in footer)

---

## 14. Competitor Analysis

| Competitor | Strengths | Our Differentiation |
|------------|-----------|---------------------|
| GeoSure | Mobile app, AI scores | Community-driven, free, open data |
| Equaldex | Global laws data | Focus on local safe spaces, crowdsourced |
| Purple Roofs | Accommodation focus | All venue types, safety ratings |
| Local LGBTQ guides | Curated content | Real-time community moderation |

---

## Appendix A: Quick Reference

### Meta Tag Template

```html
<title>[Page Title] | Colours of Safety</title>
<meta name="description" content="[Unique description, 150-160 chars]">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://colours-of-safety.org[route]">
<meta property="og:title" content="[Title]">
<meta property="og:description" content="[Description]">
<meta property="og:url" content="[URL]">
<meta property="og:image" content="https://colours-of-safety.org/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
```

### File Locations

```
/home/baetensjan/Projects/colours-of-safety/frontend/
├── public/
│   ├── robots.txt              # NEW
│   ├── sitemap.xml             # NEW
│   ├── og-image.jpg            # NEW
│   ├── logo.png                # NEW
│   └── apple-touch-icon.png    # NEW
├── src/
│   ├── index.html              # MODIFY
│   └── app/
│       └── core/
│           ├── seo.service.ts   # NEW
│           └── seo.resolver.ts  # NEW
```

---

*Document Version: 1.0*  
*Next Review: Post-SSR implementation*
