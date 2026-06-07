# Colours of Safety — Project TODOs

> Sources: PRD (rev 3), ARCHITECTURE, SEO_DOCUMENTATION, BEHAVIORAL_NUDGES, GROWTH_HACKING, TREND_RESEARCH_FINDINGS, ACCESSIBILITY_AUDIT, LGBTQIA_INCLUSIVITY_REPORT, UI-DESIGN (rev 2)  
> Last updated: 2026-06-07

---

## ✅ Recently Completed (2026-06-01)

| Item                               | Files                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| SEO meta tags, Open Graph, JSON-LD | `@/frontend/src/index.html`                                                                                  |
| robots.txt + sitemap.xml           | `@/frontend/public/`                                                                                         |
| Admin UI with role management      | `@/frontend/src/app/admin/`, `@/frontend/src/app/core/user.service.ts`                                       |
| SeoService + SeoResolver           | `@/frontend/src/app/core/seo.service.ts`, `@/frontend/src/app/core/seo.resolver.ts`                          |
| Route-level SEO data               | `@/frontend/src/app/app.routes.ts`                                                                           |
| CORS config via env var            | `@/backend/src/main.ts`, `.env.example`                                                                      |
| TypeORM migrations (sync disabled) | `@/backend/src/app.module.ts`, `@/backend/src/migrations/`                                                   |
| Rate limiting (100 req/min)        | `@/backend/src/app.module.ts` — `@nestjs/throttler`                                                          |
| Mobile-responsive layout           | `@/frontend/src/app/app.scss`, `@/frontend/src/app/map/map.scss`                                             |
| Privacy policy page                | `@/frontend/src/app/privacy/` + route + footer link                                                          |
| DB backup CronJob                  | `@/k8s/backup-cronjob.yml` — daily 2 AM, 7-day retention                                                     |
| District edge blending             | `@/frontend/src/app/map/map.ts` — SVG `feGaussianBlur` pane; `@/backend/src/districts/` — `blendEdges` field |

---

## P0 — Critical / Blocking Production

### Security & Infrastructure (Deploy Checklist)

| Task                          | Location                      | Note                                                     |
| ----------------------------- | ----------------------------- | -------------------------------------------------------- |
| [x] Rotate seeded credentials | `.env` → k8s secrets          | Change `reviewer123` / `superadmin123`, requires kubectl |
| [x] Rotate `JWT_SECRET`       | `.env` → k8s secrets          | Use 32+ char random string, requires kubectl             |
| [x] Restrict CORS             | `@/backend/src/main.ts`       | Configurable via `CORS_ORIGIN` env var                   |
| [x] Disable TypeORM sync      | `@/backend/src/app.module.ts` | Sync disabled in prod, migrations run automatically      |
| [x] Automated DB backups      | `@/k8s/backup-cronjob.yml`    | Daily at 2 AM, 7-day retention                           |
| [x] Create k8s secrets        | `kubectl create secret`       | See `k8s/secrets.yml.example`                            |

### Core P0 Features (PRD §2)

| Task                         | Files                                                            | Effort |
| ---------------------------- | ---------------------------------------------------------------- | ------ |
| [x] Mobile-responsive layout | `@/frontend/src/app/app.scss`, `@/frontend/src/app/map/map.scss` | ✅     |
| [x] Rate limiting            | `@/backend/src/app.module.ts` — `@nestjs/throttler`              | ✅     |
| [x] Privacy policy page      | `@/frontend/src/app/privacy/` + route + footer                   | ✅     |
| [ ] POI clustering           | `@/frontend/src/app/map/map.ts` — `leaflet.markercluster`        | ✅     |

### Accessibility — Critical (WCAG 2.1 Level A violations)

> Source: ACCESSIBILITY_AUDIT — fix in recommended priority order

| ID  | Task                                                                                                                       | Files                                                                         | Effort   |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| C6  | [x] Add `role="status" aria-live="polite" aria-atomic="true"` to toast                                                     | `@/frontend/src/app/map/map.html:88`                                          | 1 line   |
| C10 | [x] Add `aria-label="Close welcome message"` to close-hint button                                                          | `@/frontend/src/app/map/map.html:69`                                          | 1 line   |
| M7  | [x] Add `aria-hidden="true"` to brand emoji `🏳️‍🌈`                                                                           | `@/frontend/src/app/app.html:3`                                               | 1 line   |
| C2  | [x] Add `aria-label="Search city or address"` to search input                                                              | `@/frontend/src/app/map/map.html:8`                                           | 1 line   |
| C3  | [x] Add `aria-label` to all icon-only buttons (🔍 📍 ✎ ✕)                                                                  | `@/frontend/src/app/map/map.html:14-25`, `my-submissions.html:50-61`          | 5 min    |
| C4  | [x] Implement focus-trap + `role="dialog" aria-modal="true"` on edit/delete modals                                         | `@/frontend/src/app/submissions/my-submissions.html:70-126`                   | Medium   |
| M1  | [x] Add skip-to-content link + `id="main-content"` on `<main>`                                                             | `@/frontend/src/index.html`, `@/frontend/src/app/app.html`                    | 15 min   |
| C9  | [x] Add `outline: 2px solid #e84393` + `@media (forced-colors: active)` to focus styles                                    | `@/frontend/src/app/map/map.scss:170`, `@/frontend/src/app/auth/auth.scss:44` | CSS only |
| M2  | [x] Add `role="alert"` to error `<p>` in login/register; `aria-describedby` on inputs                                      | `login.html:15`, `register.html:20`                                           | 5 min    |
| M3  | [x] Bind `[attr.aria-valuetext]` on safety rating range inputs                                                             | `@/frontend/src/app/map/map.html:115`, `my-submissions.html:93`               | 15 min   |
| C1  | [x] Add `role="application" aria-label="Interactive safety map"` to map div; visually-hidden place list for screen readers | `@/frontend/src/app/map/map.html:2`                                           | 1 day    |
| M10 | [x] Replace `display:none` on `.brand-name` (mobile) with visually-hidden class or `aria-label` on brand link              | `@/frontend/src/app/app.scss:119`                                             | 15 min   |
| M11 | [x] Replace `display:none` on non-active nav links (mobile ≤480px) with accessible hamburger/disclosure pattern            | `@/frontend/src/app/app.scss:148`                                             | Medium   |
| M9  | [x] Add `[attr.aria-label]="'Change role for ' + user.displayName"` to admin role select                                   | `@/frontend/src/app/admin/admin.component.html:25`                            | 1 line   |
| M5  | [x] Add `:focus-visible` outline to review filter buttons                                                                  | `@/frontend/src/app/review/review.scss`                                       | CSS only |
| M8  | [x] Add `:focus-visible` to footer links                                                                                   | `@/frontend/src/app/app.scss:169`                                             | CSS only |
| C5  | [x] Add `aria-hidden="true"` to legend swatches; add visually-hidden rating text in marker popups                          | `@/frontend/src/app/map/map.html:55`                                          | 15 min   |
| N1  | [x] Add `aria-hidden="true"` to decorative legend swatches `<span class="swatch">`                                         | `@/frontend/src/app/map/map.html:55`                                          | 1 line   |
| C7  | [x] Wrap review note textarea in `<label>` or add `aria-label`                                                             | `@/frontend/src/app/review/review.html:52`                                    | 1 line   |
| C8  | [x] Add `aria-label="Main navigation"` to `<nav>`                                                                          | `@/frontend/src/app/app.html:7`                                               | 1 line   |

### Inclusivity — Critical (LGBTQIA_INCLUSIVITY_REPORT Phase 1)

| Task                                                                                                                                                                                                   | Files                                                                              | Effort |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------ |
| [x] Expand POI categories — add: `bookstore`, `youth_center`, `support_group`, `transgender_services`, `crisis_shelter`, `hiv_sti_testing`, `legal_aid`, `religious_spiritual`, `sexual_health_clinic` | `@/frontend/src/app/core/safety.ts`, `@/backend/src/pois/poi.entity.ts`            | ✅     |
| [x] Add wheelchair accessibility checkbox to submission form + filter                                                                                                                                  | `@/frontend/src/app/map/map.html`, `@/backend/src/pois/poi.entity.ts`              | ✅     |
| [x] Add anonymous submission toggle (hide `displayName` on contributions per-submission)                                                                                                               | `@/frontend/src/app/map/map.ts`, `@/backend/src/pois/`, `@/backend/src/districts/` | ✅     |
| [x] Add secondary visual indicators (icons/patterns) to safety colour scale for colour-blind users                                                                                                     | `@/frontend/src/app/core/safety.ts`, `@/frontend/src/app/map/map.html`             | ✅     |

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

| Task                                                                                                                                                                      | Files                                                                                | Effort   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| [x] Edit/delete pending submissions                                                                                                                                       | `@/frontend/src/app/submissions/`                                                    | 1–2 days |
| [x] Filter map by category/rating                                                                                                                                         | `@/frontend/src/app/map/map.ts`                                                      | 1–2 days |
| [x] Filter review queue                                                                                                                                                   | `@/frontend/src/app/review/review.ts`                                                | 1 day    |
| [x] Admin user management                                                                                                                                                 | `@/frontend/src/app/admin/`                                                          | ✅       |
| [x] Pronouns `<select>` on register form — options: they/them, she/her, he/him, ze/zir, prefer not to say, custom                                                         | `@/frontend/src/app/auth/register.html`, `@/backend/src/users/user.entity.ts`        | 0.5 day  |
| [x] Admin-only reviewer assignment                                                                                                                                        | `@/frontend/src/app/admin/`, `@/backend/src/auth/`                                   | ✅       |
| [x] Deletion policy — allow remove after approved/rejected                                                                                                                | `@/frontend/src/app/submissions/`, `@/backend/src/pois/`, `@/backend/src/districts/` | ✅       |
| [ ] Spam prevention — review rate limiting with Software Architect                                                                                                        | `@/backend/src/app.module.ts` — `@nestjs/throttler`                                  | TBD      |
| [x] Auto-locate map default (with Brussels fallback)                                                                                                                      | `@/frontend/src/app/map/map.ts`                                                      | ✅       |
| [ ] All pending POIs render on map at 40% opacity; districts with translucent/hatched fill; popup labels "Pending — awaiting review"; visible to everyone while in review | `@/frontend/src/app/map/map.ts`                                                      | 1–2 days |

### Quick Wins (< 1 week total)

| Task                                  | Source                       | Files                                                |
| ------------------------------------- | ---------------------------- | ---------------------------------------------------- | --- |
| [x] Social proof counter on legend    | BEHAVIORAL_NUDGES §2.1       | `@/frontend/src/app/map/map.html`                    |
| [x] Enhanced submission toast         | BEHAVIORAL_NUDGES §2.2       | `@/frontend/src/app/map/map.ts`                      |
| [x] Post-reg "add first place" prompt | BEHAVIORAL_NUDGES §2.1       | `@/frontend/src/app/auth/register.ts`                |
| [x] Contribution count on `/mine`     | BEHAVIORAL_NUDGES §2.3       | `@/frontend/src/app/submissions/my-submissions.html` |
| [x] Cluster markers                   | TREND_RESEARCH §1.2 → PRD P0 | `@/frontend/src/app/map/map.ts`                      | ✅  |
| [x] User location detection           | TREND_RESEARCH §1.3          | Geolocation API in map component                     |
| [x] Report/flag button on popup       | TREND_RESEARCH §2.2          | Marker popup template                                |
| [x] Geographic search                 | TREND_RESEARCH §1.1          | Add search input to map                              |

---

## P2 — Nice to Have (Growth)

### Marketing (Month 1)

- [ ] Set up social accounts (TikTok, Instagram, Twitter/X)
- [ ] Build press kit — founder story, screenshots, demo video
- [ ] Seed Reddit — 3 value posts in r/lgbt, r/solotravel
- [ ] Outreach to 10 LGBTQ organisations
- [ ] Shareable place links — `/place/:id` routes with per-POI OG images

### Engagement (1–2 weeks dev)

| Task                                               | Files                                                       |
| -------------------------------------------------- | ----------------------------------------------------------- |
| [ ] Onboarding tooltip tour                        | `@/frontend/src/app/core/onboarding.service.ts`             |
| [ ] "Recently approved" indicator                  | `@/frontend/src/app/map/map.ts`                             |
| [ ] Share button on marker                         | Marker popup                                                |
| [ ] Soft-gate drawing for guests                   | `@/frontend/src/app/map/map.ts`                             |
| [ ] Email notifications                            | Backend + email provider                                    |
| [x] Cookie consent banner                          | `@/frontend/src/app/core/cookie-consent.component.ts`       |
| [x] High contrast mode / colour-blind safe palette | `@/frontend/src/app/map/map.scss`, `@/frontend/src/styles/` |
| [x] `prefers-reduced-motion` — toast + animations  | `@/frontend/src/app/map/map.scss`                           |
| [x] Email verification                             | Backend + frontend flow                                     |

### Moderation & Content

- [x] Bulk approve/reject in queue
- [ ] Edit suggestions for approved POIs
- [x] `/place/:id` individual pages
- [x] Dynamic sitemap generation

### Community Voting System (PRD P2 — promoted from P3)

> Pending visible to all logged-in users; guests see none; threshold-based auto-approval.

| Task                                                                                                                 | Files                                                                            | Effort  |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| [ ] `votes` field on POI/district entity — store net score + per-user+IP vote record (prevent duplicates)            | `@/backend/src/pois/poi.entity.ts`, `@/backend/src/districts/district.entity.ts` | 1 day   |
| [ ] `POST /pois/:id/vote` + `POST /districts/:id/vote` endpoints — ≤1 vote per user+IP combo per item                | `@/backend/src/pois/`, `@/backend/src/districts/`                                | 1 day   |
| [ ] Auto-approval trigger — when upvotes ≥ threshold (exact value TBC with Reality Checker), set `status = approved` | Backend service logic                                                            | 0.5 day |
| [ ] Admin-configurable threshold setting                                                                             | `@/backend/src/`, admin UI                                                       | 0.5 day |
| [ ] All pending submissions visible to logged-in users at 40% opacity on map (guests see none)                       | `@/frontend/src/app/map/map.ts`                                                  | 1 day   |
| [ ] Marker/area popup shows vote tally + upvote button only (logged-in only, no downvote)                            | `@/frontend/src/app/map/map.html`                                                | 1 day   |
| [ ] Reviewer queue shows vote score per item; sort highly-upvoted items to top                                       | `@/frontend/src/app/review/review.ts`                                            | 0.5 day |
| [ ] Auto-approved submissions silently approved with real-time queue update                                          | Backend + review UI                                                              | 0.5 day |

### Inclusivity — Phase 2 (LGBTQIA_INCLUSIVITY_REPORT)

| Task                                                                                                                                                       | Files                                               | Effort  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- |
| [ ] Multi-dimensional safety ratings — replace existing 1–5 with `physicalSafety`, `emotionalSafety`, `bathroomAccess`, `racialSafety`, `disabilityAccess` | Backend entity + frontend form + map display        | 1 week  |
| [ ] Pronouns field (optional) in user profile                                                                                                              | `@/backend/src/users/user.entity.ts`, register form | 0.5 day |
| [ ] "Queer" terminology preference — user-selectable language in profile                                                                                   | `@/backend/src/users/user.entity.ts`, settings UI   | 0.5 day |
| [ ] Add geolocation privacy warning before requesting permission                                                                                           | `@/frontend/src/app/map/map.ts`                     | 1 hour  |
| [ ] Document Nominatim data sharing in privacy policy                                                                                                      | `@/frontend/src/app/privacy/`                       | 1 hour  |
| [ ] Account deletion (right to be forgotten / GDPR Art. 17)                                                                                                | Backend delete endpoint + frontend UI               | 1 day   |
| [ ] GDPR Article 9 explicit consent — sexual orientation data inferred from usage                                                                          | Privacy policy + consent flow                       | 0.5 day |
| [ ] Mandatory reviewer bias training — block reviews until guidelines acknowledged                                                                         | `@/docs/reviewerGuidelines.md`, review UI           | 1 day   |
| [ ] Appeals process for rejected submissions                                                                                                               | Backend + frontend                                  | 1 day   |

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
- [ ] Tags/attributes ("Trans-owned", "BIPOC-welcoming", "Youth-friendly")
- [ ] User reviews on places
- [ ] "Verify" system — confirm place still safe

### Inclusivity — Phase 3 (LGBTQIA_INCLUSIVITY_REPORT + UI-DESIGN)

- [ ] i18n framework + priority languages: Spanish, Portuguese, French, Arabic (language selector in topbar/footer, dynamic `lang` on `<html>`)
- [ ] Community symbols — Progress Pride, Transgender, Intersex, Asexual flags in relevant category contexts (youth centers, trans services, etc.) in topbar + map markers
- [ ] User-configurable default map centre (remove Brussels hardcode; auto-locate already planned in P0)
- [ ] COPPA review — age verification / youth safety policy
- [ ] 2FA (TOTP/WebAuthn) for admin/reviewer accounts
- [ ] "Stealth mode" educational notice — private browsing guidance re: browser history

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

## Open Questions

### Resolve before P0 launch

| Question                       | Context | Decision                                                                                             |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| Self-registration to reviewer? | PRD §5  | **Admin-only.** Admins assign reviewer role; no self-registration                                    |
| Deletion policy?               | PRD §5  | **Removable after final state.** Submissions deletable once approved (live district/POI) or rejected |
| Spam prevention?               | PRD §5  | **Defer to Software Architect.** Rate-limiting design to be reviewed with Architect                  |
| Geographic scope?              | PRD §5  | **Auto-locate.** Map defaults to user geolocation; fallback to Brussels                              |
| Data licensing?                | PRD §5  | **Open / free licence.** Data stays open source; revenue limited to donations and/or ads only        |

### Resolve before P2

| Question                              | Context    | Decision                                                                               |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Anonymity default?                    | LGBTQIA §3 | **No.** Named by default; anonymous toggle per submission (already implemented)        |
| "Queer" terminology preference?       | LGBTQIA §5 | **User-selectable.** Allow user to choose preferred terminology in profile             |
| Multi-dim ratings — rollout strategy? | LGBTQIA §6 | **Replace existing 1–5.** Full migration to multi-dimensional safety ratings           |
| Reviewer bias training — mandatory?   | LGBTQIA §7 | **Mandatory.** Block reviews until reviewer acknowledges guidelines                    |
| Pending visibility scope?             | PRD §5 Q6  | **All logged-in users.** All pending visible to any authenticated user at 40% opacity  |
| Auto-accept threshold?                | PRD §5 Q7  | **Upvotes only.** One vote per user+IP combo; exact threshold TBC with Reality Checker |
| Vote manipulation prevention?         | PRD §5 Q8  | **Login-gated.** Only authenticated users can vote; no guest voting                    |
| Auto-accepted submissions in queue?   | PRD §5 Q9  | **Silent approval.** Auto-accepted items approved in real time; queue updated silently |
