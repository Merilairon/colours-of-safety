# Colours of Safety — Project TODOs

> Sources: PRD, ARCHITECTURE, SEO_DOCUMENTATION, BEHAVIORAL_NUDGES, GROWTH_HACKING, TREND_RESEARCH_FINDINGS  
> Last updated: 2026-06-01

---

## ✅ Recently Completed (2026-06-01)

| Item                               | Files                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| SEO meta tags, Open Graph, JSON-LD | `@/frontend/src/index.html`                                                         |
| robots.txt + sitemap.xml           | `@/frontend/public/`                                                                |
| Admin UI with role management      | `@/frontend/src/app/admin/`, `@/frontend/src/app/core/user.service.ts`              |
| SeoService + SeoResolver           | `@/frontend/src/app/core/seo.service.ts`, `@/frontend/src/app/core/seo.resolver.ts` |
| Route-level SEO data               | `@/frontend/src/app/app.routes.ts`                                                  |
| CORS config via env var            | `@/backend/src/main.ts`, `.env.example`                                             |
| TypeORM migrations (sync disabled) | `@/backend/src/app.module.ts`, `@/backend/src/migrations/`                          |
| Rate limiting (100 req/min)        | `@/backend/src/app.module.ts` — `@nestjs/throttler`                                 |
| Mobile-responsive layout           | `@/frontend/src/app/app.scss`, `@/frontend/src/app/map/map.scss`                    |
| Privacy policy page                | `@/frontend/src/app/privacy/` + route + footer link                                 |
| DB backup CronJob                  | `@/k8s/backup-cronjob.yml` — daily 2 AM, 7-day retention                            |

---

## P0 — Critical / Blocking Production

### Security & Infrastructure (Deploy Checklist)

| Task                          | Location                      | Note                                                     |
| ----------------------------- | ----------------------------- | -------------------------------------------------------- |
| [ ] Rotate seeded credentials | `.env` → k8s secrets          | Change `reviewer123` / `superadmin123`, requires kubectl |
| [ ] Rotate `JWT_SECRET`       | `.env` → k8s secrets          | Use 32+ char random string, requires kubectl             |
| [x] Restrict CORS             | `@/backend/src/main.ts`       | Configurable via `CORS_ORIGIN` env var                   |
| [x] Disable TypeORM sync      | `@/backend/src/app.module.ts` | Sync disabled in prod, migrations run automatically      |
| [x] Automated DB backups      | `@/k8s/backup-cronjob.yml`    | Daily at 2 AM, 7-day retention                           |
| [ ] Create k8s secrets        | `kubectl create secret`       | See `k8s/secrets.yml.example`                            |

### Core P0 Features (PRD §2)

| Task                         | Files                                                            | Effort |
| ---------------------------- | ---------------------------------------------------------------- | ------ |
| [x] Mobile-responsive layout | `@/frontend/src/app/app.scss`, `@/frontend/src/app/map/map.scss` | ✅     |
| [x] Rate limiting            | `@/backend/src/app.module.ts` — `@nestjs/throttler`              | ✅     |
| [x] Privacy policy page      | `@/frontend/src/app/privacy/` + route + footer                   | ✅     |

---

## P1 — Should Have (Quality & Trust)

### SEO (Phase 2 — High Impact)

| Task                             | Files                               | Effort   |
| -------------------------------- | ----------------------------------- | -------- |
| [x] Meta tags, OG, Twitter Cards | `@/frontend/src/index.html`         | ✅       |
| [x] robots.txt + sitemap.xml     | `@/frontend/public/`                | ✅       |
| [x] SeoService + resolver        | `@/frontend/src/app/core/`          | ✅       |
| [ ] Angular SSR                  | `ng add @angular/ssr`               | 1–2 days |
| [ ] Google Search Console        | Manual setup                        | 2 hours  |
| [ ] GA4 analytics                | `gtag.js` or `ngx-google-analytics` | 4 hours  |
| [ ] Performance audit            | Lighthouse + WebPageTest            | 1 day    |
| [ ] Content enhancements         | Map page descriptions, FAQ          | 1 day    |

### P1 Features (PRD §2)

| Task                                | Files                                 | Effort   |
| ----------------------------------- | ------------------------------------- | -------- |
| [ ] Edit/delete pending submissions | `@/frontend/src/app/submissions/`     | 1–2 days |
| [ ] Filter map by category/rating   | `@/frontend/src/app/map/map.ts`       | 1–2 days |
| [ ] Filter review queue             | `@/frontend/src/app/review/review.ts` | 1 day    |
| [x] Admin user management           | `@/frontend/src/app/admin/`           | ✅       |

### Quick Wins (< 1 week total)

| Task                                  | Source                 | Files                                                |
| ------------------------------------- | ---------------------- | ---------------------------------------------------- |
| [ ] Social proof counter on legend    | BEHAVIORAL_NUDGES §2.1 | `@/frontend/src/app/map/map.html`                    |
| [ ] Enhanced submission toast         | BEHAVIORAL_NUDGES §2.2 | `@/frontend/src/app/map/map.ts`                      |
| [ ] Post-reg "add first place" prompt | BEHAVIORAL_NUDGES §2.1 | `@/frontend/src/app/auth/register.ts`                |
| [ ] Contribution count on `/mine`     | BEHAVIORAL_NUDGES §2.3 | `@/frontend/src/app/submissions/my-submissions.html` |
| [ ] Cluster markers                   | TREND_RESEARCH §1.2    | Add `leaflet.markercluster`                          |
| [ ] User location detection           | TREND_RESEARCH §1.3    | Geolocation API in map component                     |
| [ ] Report/flag button on popup       | TREND_RESEARCH §2.2    | Marker popup template                                |
| [ ] Geographic search                 | TREND_RESEARCH §1.1    | Add search input to map                              |

---

## P2 — Nice to Have (Growth)

### Marketing (Month 1)

- [ ] Set up social accounts (TikTok, Instagram, Twitter/X)
- [ ] Build press kit — founder story, screenshots, demo video
- [ ] Seed Reddit — 3 value posts in r/lgbt, r/solotravel
- [ ] Outreach to 10 LGBTQ organisations
- [ ] Shareable place links — `/place/:id` routes with per-POI OG images

### Engagement (1–2 weeks dev)

| Task                              | Files                                                 |
| --------------------------------- | ----------------------------------------------------- |
| [ ] Onboarding tooltip tour       | `@/frontend/src/app/core/onboarding.service.ts`       |
| [ ] "Recently approved" indicator | `@/frontend/src/app/map/map.ts`                       |
| [ ] Share button on marker        | Marker popup                                          |
| [ ] Soft-gate drawing for guests  | `@/frontend/src/app/map/map.ts`                       |
| [ ] Email notifications           | Backend + email provider                              |
| [ ] Cookie consent banner         | `@/frontend/src/app/core/cookie-consent.component.ts` |
| [ ] Accessibility (WCAG 2.1 AA)   | Audit + fixes                                         |
| [ ] High contrast mode            | `@/frontend/src/styles/`                              |
| [ ] Email verification            | Backend + frontend flow                               |

### Moderation & Content

- [ ] Bulk approve/reject in queue
- [ ] Edit suggestions for approved POIs
- [ ] `/place/:id` individual pages
- [ ] Dynamic sitemap generation

---

## P3 — Future / Exploratory

### Growth (Month 2–3)

- [ ] Product Hunt launch
- [ ] Influencer collaboration (micro-tier LGBTQ creators)
- [ ] City guide blog posts
- [ ] Referral system with badges
- [ ] Newsletter — weekly digest
- [ ] Contributor tier badges (Bronze/Silver/Gold)
- [ ] Reviewer nomination prompt

### Rich Content

- [ ] Photo uploads with moderation
- [ ] Operating hours, website links per POI
- [ ] Tags/attributes ("Wheelchair accessible", "Trans-owned")
- [ ] User reviews on places
- [ ] "Verify" system — confirm place still safe

### Technical

| Task                       | Files                                |
| -------------------------- | ------------------------------------ |
| [ ] PWA support            | `ng add @angular/pwa`                |
| [ ] Redis caching          | Backend `CacheModule`                |
| [ ] API pagination         | `@/backend/src/common/pagination.ts` |
| [ ] Audit logging          | Backend interceptor                  |
| [ ] Sentry error tracking  | `Sentry.init()`                      |
| [ ] Health check endpoints | `@/backend/src/health/`              |

---

## Open Questions (Resolve by P0)

| Question                       | Context | Decision Needed                       |
| ------------------------------ | ------- | ------------------------------------- |
| Self-registration to reviewer? | PRD §5  | User-requested or admin-only?         |
| Deletion policy?               | PRD §5  | Delete pending only, or approved too? |
| Spam prevention?               | PRD §5  | Rate-limiting design                  |
| Geographic scope?              | PRD §5  | Brussels default or auto-locate?      |
| Data licensing?                | PRD §5  | ODbL for OSM compatibility?           |
