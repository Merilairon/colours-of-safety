# Colours of Safety — Project TODOs

> Sources: PRD (rev 4), ARCHITECTURE, SEO_DOCUMENTATION, BEHAVIORAL_NUDGES, GROWTH_HACKING, TREND_RESEARCH_FINDINGS, ACCESSIBILITY_AUDIT, LGBTQIA_INCLUSIVITY_REPORT, UI-DESIGN (rev 3), LIVE_SITE_AUDIT (2026-09-29)  
> Last updated: 2026-10-04
>
> **IDs:** `LSA-Bx` / `LSA-Ax` / `LSA-Fx` refer to bugs, accessibility issues and missing features in [LIVE_SITE_AUDIT.md](LIVE_SITE_AUDIT.md).
> Items marked **⚠ Reopened** were previously ticked `[x]`, but the live audit found them broken or inactive in production. Keep them open until they are verified on coloursofsafety.com, not just merged.

---

## ✅ Recently Completed (2026-06-01)

| Item                               | Files                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| SEO meta tags, Open Graph, JSON-LD | `@/frontend/src/index.html`                                                                                                 |
| robots.txt + sitemap.xml           | `@/frontend/public/`                                                                                                        |
| Admin UI with role management      | `@/frontend/src/app/admin/`, `@/frontend/src/app/core/user.service.ts`                                                      |
| SeoService + SeoResolver           | `@/frontend/src/app/core/seo.service.ts`, `@/frontend/src/app/core/seo.resolver.ts`                                         |
| Route-level SEO data               | `@/frontend/src/app/app.routes.ts`                                                                                          |
| CORS config via env var            | `@/backend/src/main.ts`, `.env.example`                                                                                     |
| TypeORM migrations (sync disabled) | `@/backend/src/app.module.ts`, `@/backend/src/migrations/`                                                                  |
| Rate limiting (100 req/min)        | `@/backend/src/app.module.ts` — `@nestjs/throttler`                                                                         |
| Mobile-responsive layout           | `@/frontend/src/app/app.scss`, `@/frontend/src/app/map/map.scss`                                                            |
| Privacy policy page                | `@/frontend/src/app/privacy/` + route + footer link                                                                         |
| DB backup CronJob                  | `@/k8s/backup-cronjob.yml` — daily 2 AM, 7-day retention                                                                    |
| District edge blending             | `@/frontend/src/app/map/map.ts` — SVG `feGaussianBlur` pane; `@/backend/src/districts/` — `blendEdges` field                |
| Edit proposal feature (P1)         | `@/backend/src/edits/`, `@/frontend/src/app/map/`, `@/frontend/src/app/review/`, `@/frontend/src/app/submissions/my-edits/` |

---

## P0 — Critical / Blocking Production

### 🚨 Live Site Audit — Security & Privacy (do first)

> Source: LIVE_SITE_AUDIT (2026-09-29). These put users at risk *today*, and on an LGBTQIA+ safety map a privacy leak can out people. Ship as hotfixes ahead of any feature work.

| ID      | Task                                                                                                                                                                                                                                | Files                                                                                                                            | Effort  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| LSA-B1  | [~] **Code done 2026-09-29, verify in prod.** Stop leaking user internals in public API — return a public user DTO (`id`, `displayName`, `pronouns`, `avatar`) for `createdBy`; drop `reviewedBy` from public responses; `@Exclude()` all token/ban/pendingEmail fields. Add an e2e allow-list test on `/api/pois` + `/api/districts` payload keys | `@/backend/src/users/user.entity.ts`, `@/backend/src/pois/`, `@/backend/src/districts/`, `@/backend/src/edits/`                   | 1 day   |
| LSA-B2  | [~] **Code done 2026-09-29, verify in prod.** Enforce `isAnonymous` server-side — null `createdBy`/`createdById` for anonymous items (except owner, reviewers, admins) + test                                                                                                 | `@/backend/src/pois/`, `@/backend/src/districts/`                                                                                | 0.5 day |
| LSA-B4a | [~] **Code done 2026-09-29.** Remove `console.log` of verification / email-change tokens and user emails; tokens now stored as SHA-256 hashes and old plaintext tokens nulled by migration. **Ops left:** purge existing backend logs (pod logs, any log shipping, Sentry breadcrumbs)                                                                                                                                 | `@/backend/src/auth/auth.service.ts:48,109,162`                                                                                  | 1 hour  |
| LSA-B5  | [~] **Code done 2026-09-29** (Flag → `support@coloursofsafety.com` with place name/id prefilled; `security.txt` lists `security@`). **Ops left:** Cloudflare Email Routing for `support@`, `privacy@`, `security@`, then send a test to each. Fix undeliverable addresses — set up MX / email routing for `coloursofsafety.com`; replace `support@colours-of-safety.org` (NXDOMAIN) in the Flag link; verify `privacy@` receives mail                                        | DNS (Cloudflare), `@/frontend/src/app/map/map.ts:980`, `@/frontend/src/app/privacy/`                                              | 2 hours |
| LSA-B9  | [~] **Code done 2026-09-29, verify in prod** (headers are in the k8s ConfigMap too; check Cloudflare doesn't inject scripts the CSP blocks). Add security headers — HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`; `helmet` + disable `X-Powered-By` in backend; publish `/.well-known/security.txt`                        | `@/frontend/nginx.conf`, `@/backend/src/main.ts`, `@/frontend/public/.well-known/`                                                | 0.5 day |
| LSA-B8  | [~] **Code done 2026-09-29, verify in prod** (existing users are logged out once; password change/reset now revokes older sessions). Move session token from `localStorage` to `HttpOnly; Secure; SameSite=Strict` cookie (depends on CSP from LSA-B9 as interim mitigation)                                                                                          | `@/frontend/src/app/core/auth.service.ts`, `@/backend/src/auth/`                                                                  | 2 days  |

### 🚨 Live Site Audit — Broken Core Features

| ID       | Task                                                                                                                                                                             | Files                                                                                              | Effort   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| LSA-B3   | [~] **Code done 2026-09-29, verify in prod** (also added `GET /api/districts/:id`; "View on map" now deep-links via `?lat=&lng=&z=`). Add `GET /api/pois/:id` (public for approved; owner/reviewer for pending). `/place/:id` currently shows "Could not load place details" for **every** place. Per-place title/description; not-found state for bad ids | `@/backend/src/pois/pois.controller.ts`, `@/frontend/src/app/place/`                               | 1 day    |
| LSA-B4b  | [~] **Code done 2026-09-29** (SMTP via nodemailer; `/verify-email` and `/confirm-email` link pages; resend button on Profile). **Ops left:** pick a provider, verify SPF/DKIM for `coloursofsafety.com`, add `SMTP_HOST/PORT/USER/PASS` to `app-secrets`. Integrate transactional email provider — verification and email-change emails are never sent, so no user can verify and email change can't complete                                        | `@/backend/src/auth/`, new mail module, k8s secrets                                                | 2 days   |
| LSA-F1   | [~] **Code done 2026-09-29; live once LSA-B4b SMTP is configured.** Password reset flow — "Forgot password?" link, token email, reset page (depends on LSA-B4b)                                                                                  | `@/backend/src/auth/`, `@/frontend/src/app/auth/`                                                  | 1–2 days |
| LSA-B6   | [~] **Code done 2026-09-29, verify in prod.** Fix malformed canonical / `og:url` (`https://coloursofsafety.comlogin/`) — add missing `/` and map `UrlSegment.path`                                                           | `@/frontend/src/app/core/seo.resolver.ts`                                                          | 15 min   |
| LSA-B7   | [~] **Code done 2026-09-29, verify in prod.** "0 safe spaces mapped" counter — set `approvedCount` on initial load, not only in `reloadStats()`                                                                            | `@/frontend/src/app/map/map.ts:721`                                                                | 15 min   |
| LSA-B15  | [~] **Code done 2026-09-29, verify in prod.** Auth form validation — `required`/`minlength`, visible errors + `aria-invalid` on empty/weak submit; move focus to error after failed login; remove duplicate "Prefer not to say" pronoun option | `@/frontend/src/app/auth/login.*`, `@/frontend/src/app/auth/register.*`                            | 0.5 day  |

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
| [~] **Code done 2026-10-04, verify in prod.** Root cause: plugin additions are only on the global `L`, not the bundled `import * as L` namespace. POI clustering — **⚠ Reopened 2026-09-29** (LSA-F6): prod renders 2 320 unclustered shapes; `markerClusterGroup` fallback path is taken | `@/frontend/src/app/map/map.ts:156` — `leaflet.markercluster` | 0.5 day |

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
| C1  | [~] **Code done 2026-10-04, verify in prod.** (place list, LSA-A1) Add `role="application" aria-label="Interactive safety map"` to map div; visually-hidden place list for screen readers — **⚠ Reopened 2026-09-29** (LSA-A1): no reachable place list in prod | `@/frontend/src/app/map/map.html:2`                                           | 1 day    |
| M10 | [x] Replace `display:none` on `.brand-name` (mobile) with visually-hidden class or `aria-label` on brand link              | `@/frontend/src/app/app.scss:119`                                             | 15 min   |
| M11 | [x] Replace `display:none` on non-active nav links (mobile ≤480px) with accessible hamburger/disclosure pattern            | `@/frontend/src/app/app.scss:148`                                             | Medium   |
| M9  | [x] Add `[attr.aria-label]="'Change role for ' + user.displayName"` to admin role select                                   | `@/frontend/src/app/admin/admin.component.html:25`                            | 1 line   |
| M5  | [x] Add `:focus-visible` outline to review filter buttons                                                                  | `@/frontend/src/app/review/review.scss`                                       | CSS only |
| M8  | [x] Add `:focus-visible` to footer links                                                                                   | `@/frontend/src/app/app.scss:169`                                             | CSS only |
| C5  | [~] Add `aria-hidden="true"` to legend swatches; add visually-hidden rating text in marker popups — markers now carry the symbol too (LSA-A2), verify in prod | `@/frontend/src/app/map/map.html:55`                                          | 15 min   |
| N1  | [x] Add `aria-hidden="true"` to decorative legend swatches `<span class="swatch">`                                         | `@/frontend/src/app/map/map.html:55`                                          | 1 line   |
| C7  | [x] Wrap review note textarea in `<label>` or add `aria-label`                                                             | `@/frontend/src/app/review/review.html:52`                                    | 1 line   |
| C8  | [x] Add `aria-label="Main navigation"` to `<nav>`                                                                          | `@/frontend/src/app/app.html:7`                                               | 1 line   |

### Inclusivity — Critical (LGBTQIA_INCLUSIVITY_REPORT Phase 1)

| Task                                                                                                                                                                                                   | Files                                                                              | Effort |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------ |
| [x] Expand POI categories — add: `bookstore`, `youth_center`, `support_group`, `transgender_services`, `crisis_shelter`, `hiv_sti_testing`, `legal_aid`, `religious_spiritual`, `sexual_health_clinic` | `@/frontend/src/app/core/safety.ts`, `@/backend/src/pois/poi.entity.ts`            | ✅     |
| [x] Add wheelchair accessibility checkbox to submission form + filter                                                                                                                                  | `@/frontend/src/app/map/map.html`, `@/backend/src/pois/poi.entity.ts`              | ✅     |
| [ ] Add anonymous submission toggle (hide `displayName` on contributions per-submission) — **⚠ Reopened 2026-09-29** (LSA-B2): toggle stored but not enforced by API                                                                                                               | `@/frontend/src/app/map/map.ts`, `@/backend/src/pois/`, `@/backend/src/districts/` | ✅     |
| [~] **Code done 2026-10-04, verify in prod.** Add secondary visual indicators (icons/patterns) to safety colour scale for colour-blind users — **⚠ Reopened 2026-09-29** (LSA-A2): only in legend/popup, not on map markers                                                                                                     | `@/frontend/src/app/core/safety.ts`, `@/frontend/src/app/map/map.html`             | ✅     |

---

## P1 — Should Have (Quality & Trust)

### Live Site Audit — Trust & Data Quality

> A safety label nobody verified is a liability. Fix how seeded data is presented before growth marketing drives traffic to it.

| ID      | Task                                                                                                                                                                                                                         | Files                                                                          | Effort   |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| LSA-B12 | [~] **Code done 2026-10-04, verify in prod.** Root cause: almost every Wikidata class ID in the seeder was wrong; `Q207694` is "art museum" (6 261 matches). Classes replaced with verified IDs; migration unpublishes all Wikidata imports (reversible) and imported duplicates within 100 m; imports show "not yet community-verified" and no rating until confirmed. **Ops left:** re-run `npm run seed:geo` in prod. Re-audit Wikidata seed (790 items incl. general art museums as "Community Space · Friendly"); badge seeded items "Imported — not yet community-verified"; hide seeder-assigned rating until community votes exist; render source as link; de-duplicate (3 dupes) | `@/backend/src/seed/geo-data-seed.service.ts`, `@/frontend/src/app/map/map.ts` | 2–3 days |
| LSA-F4  | [~] **Code done 2026-10-04, verify in prod.** (`POST /api/reports`, guests allowed at 5/10 min; Reports tab in review queue). In-app report/flag — `POST /reports` feeding the review queue with reason picker; replaces mailto                                                                                                                         | `@/backend/src/`, `@/frontend/src/app/map/`, `@/frontend/src/app/review/`      | 2 days   |
| LSA-F5  | [~] **Code done 2026-10-04, verify in prod.** (`/api/pois/:id/ratings`, one per person, optional anonymous; mean shown on map). Community ratings & reviews on places — expose voting UI (`voteCount` is 0 everywhere) and short text reviews (promoted from P3 "User reviews on places")                                                               | `@/backend/src/pois/`, `@/frontend/src/app/place/`, map popup                  | 1 week   |
| LSA-F2  | [~] **Code done 2026-10-04, verify in prod.** (address/website/opening hours on POIs, editable via submit + edit proposals; OSM directions). Rich place detail page — address, opening hours, website, directions link, link from popup (depends on LSA-B3)                                                                                                          | `@/frontend/src/app/place/`, `@/backend/src/pois/poi.entity.ts`                | 2 days   |
| LSA-F13 | [~] **Code done 2026-10-04, verify in prod.** (set on reviewer approval, approved edit, vote auto-approval and new ratings). Show "Last verified" date + source ("Community" / "Imported") on each place                                                                                                                                             | `@/frontend/src/app/place/`, map popup                                         | 0.5 day  |

### Live Site Audit — Accessibility (WCAG 2.2 AA)

> Source: LIVE_SITE_AUDIT, from axe-core plus manual keyboard testing on production. A1 and A2 are Level A failures; do those first.

| ID          | Task                                                                                                                                                         | Files                                                                         | Effort   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------- |
| LSA-A1 / F3 | [~] **Code done 2026-10-04, verify in prod.** ("List places" panel, nearest 50 in view; Enter opens the popup). Keyboard + screen-reader access to places — synchronized, keyboard-operable **list view** of places in viewport (name, category, rating, distance) that opens the popup | `@/frontend/src/app/map/`                                                     | 3 days   |
| LSA-A2      | [~] **Code done 2026-10-04, verify in prod.** (symbol ink chosen per fill for 3:1). Render rating symbol (✕ △ ◆ ✓ ★) *inside* each map marker (`divIcon`) or vary shape — markers are colour-only today                                       | `@/frontend/src/app/map/map.ts`, `@/frontend/src/app/core/safety.ts`          | 1 day    |
| LSA-A3      | [~] **Code done 2026-10-04, verify in prod.** (`#c2185b` on light, `#f48fb1` on the dark topbar/footer). Brand pink `#e84393` fails contrast (3.71:1 with white) — darken to ~`#c2185b` for buttons/CTAs/links; fix `.footer-donate` (4.4:1)                       | `@/frontend/src/styles.scss`, `@/frontend/src/app/app.scss`                   | 0.5 day  |
| LSA-A4      | [~] **Code done 2026-10-04, verify in prod.** Fix remaining contrast: hint text `#9498a8` (2.87:1), status chips on `/my-edits`, role/unverified badges on `/admin`, active tab on `/review`          | `@/frontend/src/app/auth/`, `submissions/my-edits/`, `admin/`, `review/`      | 0.5 day  |
| LSA-A5      | [~] **Code done 2026-10-04** (first in DOM/tab order, labelled region, underlined link, compact on mobile). Cookie banner: `aria-label`, first in focus order / focus on show, underline "Learn more", reduce height on mobile                                         | `@/frontend/src/app/core/cookie-consent.component.ts`                          | 2 hours  |
| LSA-A6      | [~] **Code done 2026-10-04, verify in prod.** Add visually-hidden `<h1>` on map page; legend heading → `h2`                                                                                            | `@/frontend/src/app/map/map.html`                                             | 15 min   |
| LSA-A7      | [~] **Code done 2026-10-04, verify in prod.** (Esc closes). Popup focus management — move focus into popup on open, restore on close                                                                                | `@/frontend/src/app/map/map.ts`                                               | 0.5 day  |
| LSA-A8      | [~] **Code done 2026-10-04, verify in prod.** (controls precede the map in the DOM; zoom moved bottom-right). Tab order — search/filters before map; remove Leaflet attribution link from early tab stops                                                              | `@/frontend/src/app/map/map.html`                                             | 1 hour   |
| LSA-A9      | [~] **Code done 2026-10-04, verify in prod.** `aria-live` announcements for search/filter/locate results ("Showing 42 places near Berlin"); `role="alert"` on "Location not found."                     | `@/frontend/src/app/map/`                                                     | 2 hours  |
| LSA-A10     | [~] **Code done 2026-10-04, verify in prod.** (`app-icon` / `iconSvg`). Replace emoji UI icons with SVG; `aria-hidden` decorative emoji ("❤ Support us", "🚩 Flag")                                                              | `@/frontend/src/app/`                                                         | 0.5 day  |
| LSA-A11     | [~] **Code done 2026-10-04, verify in prod.** Mobile: collapsible filter panel + legend toggle (they cover ~60% of the map at 390 px)                                                                   | `@/frontend/src/app/map/map.html`, `map.scss`                                 | 0.5 day  |
| LSA-A12     | [~] **Code done 2026-10-04, verify in prod.** Rename draw tools ("Add a place" / "Draw a district" instead of "circlemarker"); add a visible "+ Add place" button                                      | `@/frontend/src/app/map/map.ts`                                               | 2 hours  |

### Live Site Audit — SEO, Privacy & Polish

| ID      | Task                                                                                                                                                  | Files                                                            | Effort  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| LSA-B14 | [~] **Code done 2026-10-04, verify in prod** (GA only loads after *Accept*; a *Reject* is now remembered; policy lists Sentry, GA, OSM/Nominatim, Cloudflare). Don't load GTM until consent is accepted (currently loads before and after *Reject*); list Sentry as processor in privacy policy; fix banner copy ("cookies" → local storage) | `@/frontend/src/index.html`, `@/frontend/src/main.ts`, `@/frontend/src/app/privacy/` | 0.5 day |
| LSA-B10 | [~] **Code done 2026-10-04, verify in prod** (k8s ConfigMap updated too). Real 404 page (`noindex`) instead of `**` → map redirect; nginx 404 for missing static files                                                      | `@/frontend/src/app/app.routes.ts`, `@/frontend/nginx.conf`      | 2 hours |
| LSA-B11 | [~] **Code done 2026-10-04, verify in prod** (`returnUrl` restricted to in-app paths; `/profile` and `/admin` also disallowed). Guard UX — redirect logged-out `/review` & `/admin` to login; preserve `returnUrl` after login; add `/my-edits` to robots Disallow                  | `@/frontend/src/app/core/guards.ts`, `@/frontend/public/robots.txt` | 2 hours |
| LSA-B13 | [~] **Code done 2026-10-04, verify in prod** (favicon 134 KB → 15 KB). Add missing `logo.png` (JSON-LD), `apple-touch-icon.png`, web manifest; shrink 134 KB favicon + add SVG icon                                        | `@/frontend/public/`                                             | 2 hours |
| LSA-B16 | [~] **Code done 2026-10-04** (own role/ban controls hidden). **Ops left:** delete test accounts from prod DB, point e2e at staging, check the duplicate "Ixelles" edit. Remove test accounts (`Tester …`, `Devin Evidence`) from prod DB, point e2e at staging; hide (not just disable) self role/ban controls; check duplicate "Ixelles" edit | prod DB, `@/test/`, `@/frontend/src/app/admin/`                  | 2 hours |

### SEO (Phase 2 — High Impact)

| Task                             | Files                                          | Effort   |
| -------------------------------- | ---------------------------------------------- | -------- |
| [x] Meta tags, OG, Twitter Cards | `@/frontend/src/index.html`                    | ✅       |
| [x] robots.txt + sitemap.xml     | `@/frontend/public/`                           | ✅       |
| [x] SeoService + resolver        | `@/frontend/src/app/core/`                     | ✅       |
| [ ] Angular SSR — **⚠ Reopened 2026-09-29**: prod serves an empty `<app-root>` shell via nginx | `ng add @angular/ssr` — Node version fix       | 1–2 days |
| [x] Google Search Console        | Manual setup — see instructions below          | 2 hours  |
| [x] GA4 analytics                | `@/frontend/src/app/core/analytics.service.ts` | ✅       |
| [~] Performance audit            | Lighthouse + WebPageTest — manual              | 1 day    |
| [x] Content enhancements         | FAQ page, improved descriptions                | ✅       |

### P1 Features (PRD §2)

| Task                                                                                                                                                                      | Files                                                                                                                                                                                                             | Effort   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [x] Edit/delete pending submissions                                                                                                                                       | `@/frontend/src/app/submissions/`                                                                                                                                                                                 | 1–2 days |
| [x] Filter map by category/rating                                                                                                                                         | `@/frontend/src/app/map/map.ts`                                                                                                                                                                                   | 1–2 days |
| [x] Filter review queue                                                                                                                                                   | `@/frontend/src/app/review/review.ts`                                                                                                                                                                             | 1 day    |
| [x] Admin user management                                                                                                                                                 | `@/frontend/src/app/admin/`                                                                                                                                                                                       | ✅       |
| [x] Admin panel — stats bar (per-role user counts below subtitle)                                                                                                         | `@/frontend/src/app/admin/admin.component.html`, `admin.component.ts`                                                                                                                                             | 0.5 day  |
| [x] Admin panel — search + role filter bar (client-side, real-time)                                                                                                       | `@/frontend/src/app/admin/admin.component.html`, `admin.component.ts`                                                                                                                                             | 0.5 day  |
| [x] Admin panel — `(you)` label on current user's card; disable own role `<select>` + tooltip (self-demotion prevention)                                                  | `@/frontend/src/app/admin/admin.component.html`, `admin.component.ts`                                                                                                                                             | 2 hours  |
| [x] Admin panel — `⚠ Unverified` amber chip on cards where `emailVerified === false`                                                                                      | `@/frontend/src/app/admin/admin.component.html`, `admin.component.scss`                                                                                                                                           | 1 hour   |
| [x] Admin panel — human-readable option labels in role `<select>` ("Super Admin" not `super_admin`)                                                                       | `@/frontend/src/app/admin/admin.component.html`                                                                                                                                                                   | 1 hour   |
| [x] Admin panel — `Saved ✓` inline success feedback after role change (auto-hides after 2 s)                                                                              | `@/frontend/src/app/admin/admin.component.ts`, `admin.component.scss`                                                                                                                                             | 1 hour   |
| [x] Admin panel — hide `super_admin` option for non-super admins (privilege escalation guard)                                                                             | `@/frontend/src/app/admin/admin.component.html`, `admin.component.ts`                                                                                                                                             | 2 hours  |
| [x] Admin panel — "Retry" button on load error state                                                                                                                      | `@/frontend/src/app/admin/admin.component.html`, `admin.component.ts`                                                                                                                                             | 1 hour   |
| [x] Admin panel — "No users match your search." empty state for filter (client-side)                                                                                      | `@/frontend/src/app/admin/admin.component.html`                                                                                                                                                                   | 30 min   |
| [x] Topbar — show `admin` / `super_admin` role badge (currently only `reviewer` badge shown)                                                                              | `@/frontend/src/app/app.html`, `@/frontend/src/app/app.scss`                                                                                                                                                      | 1 hour   |
| [x] `adminGuard` route protection for `/admin` (requires `role === 'admin' or 'super_admin'`)                                                                             | `@/frontend/src/app/app.routes.ts`, `@/frontend/src/app/core/`                                                                                                                                                    | 1 hour   |
| [x] Pronouns `<select>` on register form — options: they/them, she/her, he/him, ze/zir, prefer not to say, custom                                                         | `@/frontend/src/app/auth/register.html`, `@/backend/src/users/user.entity.ts`                                                                                                                                     | 0.5 day  |
| [x] Admin-only reviewer assignment                                                                                                                                        | `@/frontend/src/app/admin/`, `@/backend/src/auth/`                                                                                                                                                                | ✅       |
| [x] Deletion policy — submitter can delete own submission only while `pending`; block delete after approval on frontend                                                   | `@/frontend/src/app/submissions/my-submissions.html`, `my-submissions.ts`                                                                                                                                         | 2 hours  |
| [x] Deletion policy — reviewer/admin/super admin delete endpoint sets status to `rejected` (not hard-delete) so submitter can see feedback and edit + resubmit            | `@/backend/src/pois/pois.controller.ts`, `@/backend/src/districts/districts.controller.ts`                                                                                                                        | 0.5 day  |
| [x] Deletion policy — backend guard: reject DELETE requests from non-owners on `pending` items, and from non-reviewers/admins on `approved` items                         | `@/backend/src/pois/`, `@/backend/src/districts/`, `@/backend/src/auth/`                                                                                                                                          | 0.5 day  |
| [x] Super admin privilege guard — backend: block role assignment to `admin`/`super_admin` for callers with `role !== 'super_admin'`                                       | `@/backend/src/auth/`, `@/backend/src/users/`                                                                                                                                                                     | 2 hours  |
| [x] Spam prevention — review rate limiting with Software Architect                                                                                                        | `@/backend/src/app.module.ts` — `@nestjs/throttler`                                                                                                                                                               | ✅       |
| [x] Auto-locate map default (with Brussels fallback)                                                                                                                      | `@/frontend/src/app/map/map.ts`                                                                                                                                                                                   | ✅       |
| [x] All pending POIs render on map at 40% opacity; districts with translucent/hatched fill; popup labels "Pending — awaiting review"; visible to everyone while in review | `@/frontend/src/app/map/map.ts`, `@/backend/src/pois/pois.controller.ts`, `@/backend/src/districts/districts.controller.ts`                                                                                       | ✅       |
| [x] Propose edit to any POI or district                                                                                                                                   | `@/frontend/src/app/map/map.ts`, `@/frontend/src/app/map/map.html`, `@/frontend/src/app/map/map.scss`, `@/frontend/src/app/core/models.ts`, `@/frontend/src/app/core/markings.service.ts`, `@/backend/src/edits/` | 2 days   |
| [x] Review edit-proposal queue with diff                                                                                                                                  | `@/frontend/src/app/review/review.ts`, `@/frontend/src/app/review/review.html`, `@/frontend/src/app/review/review.scss`, `@/backend/src/edits/`                                                                   | 2 days   |
| [x] My edits page                                                                                                                                                         | `@/frontend/src/app/submissions/my-edits/`, `@/frontend/src/app/app.routes.ts`, `@/frontend/src/app/app.html`, `@/frontend/src/app/core/markings.service.ts`                                                      | 1 day    |

> Status: edit-proposal feature implemented. Backend has `EditProposal` entity, endpoints, and migration; frontend has popup edit button, review diff, and My edits page.

### Profile & Settings (PRD P1)

| Task                                                        | Files                                                                        | Effort   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| [x] User profile page — view/edit display name, avatar, bio | `@/frontend/src/app/profile/`, `@/backend/src/users/`                        | 1–2 days |
| [x] Change password with current-password confirmation      | `@/frontend/src/app/profile/`, `@/backend/src/auth/`                         | 0.5 day  |
| [ ] Update email address with verification flow — **⚠ Reopened 2026-09-29** (LSA-B4b): no email sent | `@/frontend/src/app/profile/`, `@/backend/src/users/`, `@/backend/src/auth/` | 1 day    |
| [x] Notification preferences toggle                         | `@/frontend/src/app/profile/`, `@/backend/src/users/user.entity.ts`          | 0.5 day  |
| [x] Account deletion (GDPR Art. 17)                         | `@/frontend/src/app/profile/`, `@/backend/src/users/`                        | 1 day    |

### Admin Ban & Content Sweep (PRD P1)

| Task                                                                         | Files                                                                                                                        | Effort  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| [x] Add `banned` boolean + `bannedAt` timestamp + `banReason` to user entity | `@/backend/src/users/user.entity.ts`, `@/backend/src/migrations/1718200000000-AddUserBanAndSubmissionBan.ts`                 | 0.5 day |
| [x] Ban/unban controls in admin panel                                        | `@/frontend/src/app/admin/`, `@/backend/src/users/dto/ban-user.dto.ts`                                                       | 0.5 day |
| [x] Block banned users from login and all authenticated actions              | `@/backend/src/auth/auth.service.ts`, `@/backend/src/auth/jwt.strategy.ts`                                                   | 0.5 day |
| [x] Hide all POIs/districts owned by banned users from public map            | `@/backend/src/users/users.service.ts`, `@/backend/src/pois/pois.service.ts`, `@/backend/src/districts/districts.service.ts` | 1 day   |
| [x] Soft-delete / unban restore path                                         | `@/backend/src/users/users.service.ts`, `@/backend/src/users/users.controller.ts`                                            | 0.5 day |

### Quick Wins (< 1 week total)

| Task                                  | Source                       | Files                                                |
| ------------------------------------- | ---------------------------- | ---------------------------------------------------- | --- |
| [ ] Social proof counter on legend — **⚠ Reopened 2026-09-29** (LSA-B7): always shows 0 | BEHAVIORAL_NUDGES §2.1       | `@/frontend/src/app/map/map.html`                    |
| [x] Enhanced submission toast         | BEHAVIORAL_NUDGES §2.2       | `@/frontend/src/app/map/map.ts`                      |
| [x] Post-reg "add first place" prompt | BEHAVIORAL_NUDGES §2.1       | `@/frontend/src/app/auth/register.ts`                |
| [x] Contribution count on `/mine`     | BEHAVIORAL_NUDGES §2.3       | `@/frontend/src/app/submissions/my-submissions.html` |
| [x] Cluster markers                   | TREND_RESEARCH §1.2 → PRD P0 | `@/frontend/src/app/map/map.ts`                      | ✅  |
| [x] User location detection           | TREND_RESEARCH §1.3          | Geolocation API in map component                     |
| [~] **Code done 2026-10-04, verify in prod.** (in-app dialog, LSA-F4) Report/flag button on popup — **⚠ Reopened 2026-09-29** (LSA-B5, LSA-F4): mailto target domain does not exist | TREND_RESEARCH §2.2          | Marker popup template                                |
| [x] Geographic search                 | TREND_RESEARCH §1.1          | Add search input to map                              |

---

## P2 — Nice to Have (Growth)

### Live Site Audit — Missing Features

| ID      | Task                                                                                                              | Files                                              | Effort   |
| ------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| LSA-F9  | [ ] "Quick exit" / panic button + discreet mode (neutral tab title), which is standard on safety resources for at-risk users | `@/frontend/src/app/app.html`                      | 0.5 day  |
| LSA-F7  | [ ] Map state in URL (`?lat=&lng=&z=&category=&rating=`) so views are shareable, bookmarkable and Back works      | `@/frontend/src/app/map/map.ts`                    | 1 day    |
| LSA-F8  | [ ] Search autocomplete + search by place *name* (currently only geocodes cities/addresses)                       | `@/frontend/src/app/map/`, `@/backend/src/pois/`   | 2 days   |
| LSA-F12 | [ ] Favourites / saved places for travellers                                                                      | `@/backend/src/users/`, `@/frontend/src/app/`      | 2 days   |
| LSA-F14 | [ ] Proper 404 page (tracked as LSA-B10 in P1)                                                                    | —                                                  | —        |

> LSA-F10 (i18n) and LSA-F11 (PWA/offline) are already planned in P3. The worldwide dataset (Vietnam, Brazil, Ukraine…) argues for pulling i18n forward once P1 is done.

### Marketing (Month 1)

- [ ] Set up social accounts (TikTok, Instagram, Twitter/X)
- [ ] Build press kit — founder story, screenshots, demo video
- [ ] Seed Reddit — 3 value posts in r/lgbt, r/solotravel
- [ ] Outreach to 10 LGBTQ organisations
- [ ] Shareable place links — `/place/:id` routes with per-POI OG images (blocked by LSA-B3)

### Engagement (1–2 weeks dev)

| Task                                               | Files                                                       |
| -------------------------------------------------- | ----------------------------------------------------------- |
| [ ] Onboarding tooltip tour                        | `@/frontend/src/app/core/onboarding.service.ts`             |
| [ ] "Recently approved" indicator                  | `@/frontend/src/app/map/map.ts`                             |
| [ ] Share button on marker                         | Marker popup                                                |
| [ ] Soft-gate drawing for guests                   | `@/frontend/src/app/map/map.ts`                             |
| [ ] Email notifications (depends on LSA-B4b mail provider) | Backend + email provider                                    |
| [x] Cookie consent banner                          | `@/frontend/src/app/core/cookie-consent.component.ts`       |
| [x] High contrast mode / colour-blind safe palette | `@/frontend/src/app/map/map.scss`, `@/frontend/src/styles/` |
| [x] `prefers-reduced-motion` — toast + animations  | `@/frontend/src/app/map/map.scss`                           |
| [ ] Email verification — **⚠ Reopened 2026-09-29** (LSA-B4b): tokens only logged, never emailed | Backend + frontend flow                                     |

### Moderation & Content

- [x] Bulk approve/reject in queue
- [x] Edit suggestions for approved POIs → promoted to P1; see PRD §2 P1 / §3
- [ ] `/place/:id` individual pages — **⚠ Reopened 2026-09-29** (LSA-B3): backend route missing, every page errors
- [ ] Dynamic sitemap generation — **⚠ Reopened 2026-09-29**: live sitemap is a static 5-URL file, no place pages, no `lastmod`

### Legal & Licensing

| Task                                                                             | Files                                                        | Effort  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| [x] Add open-source data licence notice (e.g. ODbL) to privacy policy and footer | `@/frontend/src/app/privacy/`, `@/frontend/src/app/app.html` | 2 hours |
| [x] Add donations CTA / link in footer or about page                             | `@/frontend/src/app/app.html`                                | 1 hour  |

### Community Voting System (PRD P2 — promoted from P3)

> Pending visible to all logged-in users; guests see none; threshold-based auto-approval.

| Task                                                                                                                 | Files                                                                            | Effort  |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| [x] `votes` field on POI/district entity — store net score + per-user+IP vote record (prevent duplicates)            | `@/backend/src/pois/poi.entity.ts`, `@/backend/src/districts/district.entity.ts` | 1 day   |
| [x] `POST /pois/:id/vote` + `POST /districts/:id/vote` endpoints — ≤1 vote per user+IP combo per item                | `@/backend/src/pois/`, `@/backend/src/districts/`                                | 1 day   |
| [x] Auto-approval trigger — when upvotes ≥ threshold (exact value TBC with Reality Checker), set `status = approved` | Backend service logic                                                            | 0.5 day |
| [x] Admin-configurable threshold setting                                                                             | `@/backend/src/`, admin UI                                                       | 0.5 day |
| [x] All pending submissions visible to logged-in users at 40% opacity on map (guests see none)                       | `@/frontend/src/app/map/map.ts`                                                  | 1 day   |
| [x] Marker/area popup shows vote tally + upvote button only (logged-in only, no downvote)                            | `@/frontend/src/app/map/map.html`                                                | 1 day   |
| [x] Reviewer queue shows vote score per item; sort highly-upvoted items to top                                       | `@/frontend/src/app/review/review.ts`                                            | 0.5 day |
| [x] Auto-approved submissions silently approved with real-time queue update                                          | Backend + review UI                                                              | 0.5 day |

### Inclusivity — Phase 2 (LGBTQIA_INCLUSIVITY_REPORT)

| Task                                                                                                                                                       | Files                                               | Effort  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- |
| [ ] Multi-dimensional safety ratings — replace existing 1–5 with `physicalSafety`, `emotionalSafety`, `bathroomAccess`, `racialSafety`, `disabilityAccess` | Backend entity + frontend form + map display        | 1 week  |
| [ ] Pronouns field (optional) in user profile                                                                                                              | `@/backend/src/users/user.entity.ts`, register form | 0.5 day |
| [ ] "Queer" terminology preference — user-selectable language in profile                                                                                   | `@/backend/src/users/user.entity.ts`, settings UI   | 0.5 day |
| [ ] Add geolocation privacy warning before requesting permission                                                                                           | `@/frontend/src/app/map/map.ts`                     | 1 hour  |
| [ ] Document Nominatim data sharing in privacy policy                                                                                                      | `@/frontend/src/app/privacy/`                       | 1 hour  |
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
- [ ] Operating hours, website links per POI (part of LSA-F2 place detail page)
- [ ] Tags/attributes ("Trans-owned", "BIPOC-welcoming", "Youth-friendly")
- [ ] User reviews on places → **promoted to P1** (LSA-F5, Trust)
- [ ] "Verify" system — confirm place still safe (pairs with LSA-F13 "last verified" date)

### Inclusivity — Phase 3 (LGBTQIA_INCLUSIVITY_REPORT + UI-DESIGN)

- [ ] (LSA-F10) i18n framework + priority languages: Spanish, Portuguese, French, Arabic (language selector in topbar/footer, dynamic `lang` on `<html>`)
- [ ] Community symbols — Progress Pride, Transgender, Intersex, Asexual flags in relevant category contexts (youth centers, trans services, etc.) in topbar + map markers
- [ ] User-configurable default map centre (remove Brussels hardcode; auto-locate already planned in P0)
- [ ] COPPA review — age verification / youth safety policy
- [ ] 2FA (TOTP/WebAuthn) for admin/reviewer accounts
- [ ] "Stealth mode" educational notice — private browsing guidance re: browser history

### Technical

| Task                       | Files                                |
| -------------------------- | ------------------------------------ |
| [ ] PWA support + web manifest (LSA-F11, LSA-B13) | `ng add @angular/pwa`                |
| [ ] Redis caching          | Backend `CacheModule`                |
| [ ] API pagination (also admin users list, LSA-B16) | `@/backend/src/common/pagination.ts` |
| [ ] Audit logging          | Backend interceptor                  |
| [x] Sentry error tracking — implemented; consent gating tracked in LSA-B14 | `@/frontend/src/main.ts` |
| [ ] Health check endpoints | `@/backend/src/health/`              |

---

## Open Questions

### ✅ Resolved (P0)

| Question                       | Context      | Decision                                                                                                                                                                                                                    |
| ------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self-registration to reviewer? | PRD §5       | **No.** Admin or super admin must assign; no self-registration. → Tasked in P1.                                                                                                                                             |
| Super admin privilege scope?   | UI-DESIGN §6 | **Same as admin + escalation.** Super admin can assign/change `admin` and `super_admin` roles; regular admins cannot. → Tasked in P1.                                                                                       |
| Deletion policy?               | PRD §5       | **Role-gated + soft-delete.** Submitter deletes only while `pending`; post-approval deletion by reviewer/admin/super admin only; sets status `rejected` so submitter sees feedback and can edit + resubmit. → Tasked in P1. |
| Spam prevention?               | PRD §5       | **Rate-limiting implemented.** 100 req/min via `@nestjs/throttler`. ✅                                                                                                                                                      |
| Geographic scope?              | PRD §5       | **Auto-locate implemented.** Map defaults to user geolocation; fallback Brussels. ✅                                                                                                                                        |
| Data licensing?                | PRD §5       | **Open source only.** ODbL or equivalent; revenue: donations primary, ads possible in future. → Tasked in P2.                                                                                                               |

### Resolve before P0 launch

_All P0 questions resolved. See table above._

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
