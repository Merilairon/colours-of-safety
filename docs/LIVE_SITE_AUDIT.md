# Live Site Audit — coloursofsafety.com

**Date:** 2026-09-29
**Method:** Automated browsing of the production site with headless Chrome 154 (desktop 1366×800 and mobile 390×844), [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.0/2.1/2.2 A+AA + best-practice), and manual probing of HTTP headers and public API responses. Logged-out and logged-in (super_admin) sessions were tested. The logged-in session was **read-only**: all write requests to `/api/` were blocked by the test harness.
**Relation to earlier docs:** [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) was a static code review from 2026-06-01. This report covers what is actually observable in production. Items from that audit that are still open are called out below.

Severity scale: **Critical** (security/privacy exposure or core feature broken), **High** (significant user impact or WCAG Level A failure), **Medium** (WCAG AA failure, degraded UX, SEO damage), **Low** (polish).

---

## Summary

| # | Finding | Area | Severity |
|---|---|---|---|
| B1 | Public API leaks internal user fields (email-verification & email-change tokens, pending email, ban reason) | Security | Critical |
| B2 | `isAnonymous` is never enforced — anonymous submissions still expose the author | Privacy | Critical |
| B3 | Place detail page (`/place/:id`) is broken for every place — backend has no `GET /api/pois/:id` | Bug | Critical |
| B4 | No email is ever sent; tokens (and user emails) are written to server logs instead | Bug / Security | Critical |
| B5 | "🚩 Flag" reports go to a non-existent domain; site's own contact addresses have no MX | Bug / Trust & Safety | High |
| B6 | Canonical URL and `og:url` are malformed on every non-home page (`https://coloursofsafety.comlogin/`) | SEO | High |
| B7 | "0 safe spaces mapped" counter is always 0 | Bug | Medium |
| B8 | Auth token stored in `localStorage`, and no Content-Security-Policy | Security | High |
| B9 | No security headers on HTML responses; `X-Powered-By: Express` exposed | Security | Medium |
| B10 | Unknown URLs silently redirect to the map with HTTP 200 (soft 404) | Bug / SEO | Medium |
| B11 | Unauthorised visits to `/review`, `/admin` silently bounce to map; `/mine` etc. lose the return URL | UX | Low |
| B12 | Wikidata-seeded data: museums/galleries listed as "Community Space · Friendly" | Data quality | High |
| B13 | Broken assets: `logo.png` (referenced by JSON-LD), `apple-touch-icon.png`, web manifest | Bug / SEO | Low |
| B14 | Google Tag Manager and Sentry load before and after cookie *Reject* | Privacy / GDPR | Medium |
| B15 | Login/Register give no feedback on empty submit; focus is lost on error | Bug / A11y | Medium |
| B16 | Admin panel: every user shows "⚠ Unverified", test accounts in prod | Data / UX | Low |
| A1–A12 | Accessibility issues (see section) | A11y | High–Low |
| F1–F14 | Missing features (see section) | Features | — |

---

## Bugs & Security

### B1 — Public API leaks internal user fields · Critical

`GET /api/pois` (unauthenticated, 2 243 items) and `GET /api/districts` embed the full `createdBy` and `reviewedBy` user entities. Each includes:

`emailVerificationToken`, `emailVerificationExpires`, `emailChangeToken`, `emailChangeExpires`, `pendingEmail`, `banned`, `bannedAt`, `banReason`, `notificationPreferences`, `role`.

Right now only the "GeoData Seeder" account is referenced, and its token fields are `null`. **As soon as a real user's submission is approved, anyone can read that user's pending email address and live email-change / verification tokens**. That is an account-takeover primitive: confirm an email change to an attacker-controlled address.

- Cause: relations are `eager: true` ([poi.entity.ts:59](../backend/src/pois/poi.entity.ts#L59), [district.entity.ts:60](../backend/src/districts/district.entity.ts#L60), [edit-proposal.entity.ts:49](../backend/src/edits/edit-proposal.entity.ts#L49)), and only `email` and `passwordHash` carry `@Exclude()` in [user.entity.ts](../backend/src/users/user.entity.ts#L34-L62).
- Fix: expose a dedicated public DTO (`{ id, displayName, pronouns, avatar }`) for embedded users, or `@Exclude()` every token/ban/notification/pendingEmail field. Also drop `reviewedBy` from public responses entirely. Add an e2e test that asserts the public payload's user keys against an allow-list.

### B2 — `isAnonymous` is not enforced · Critical

`isAnonymous` exists on POIs and districts but is referenced nowhere in the backend except the entity and the seeder. An anonymous submission is therefore returned with the full `createdBy` user object (see B1). For an LGBTQIA+ safety map this can out people who explicitly chose anonymity.

- Fix: in the POI/district serialisation, null out `createdBy`/`createdById` when `isAnonymous` is true (except for the owner, reviewers and admins). Add a test.

### B3 — Place detail page is broken for every place · Critical

`/place/<any valid approved id>` renders **"Error — Could not load place details."** The frontend calls `GET /api/pois/:id` ([markings.service.ts:57](../frontend/src/app/core/markings.service.ts#L57)), but the backend returns `404 Cannot GET /api/pois/:id` because no such route exists.

Consequences: no shareable place links, no indexable place pages (the SEO plan depends on these), and the page `<h1>` becomes "Error" while still returning 200.

- Fix: add `GET /pois/:id` (public for approved items; owner/reviewer for pending ones). The page should also set a per-place title and description and return a not-found state for bad ids.

### B4 — Emails are never sent; secrets are logged · Critical

[auth.service.ts:48](../backend/src/auth/auth.service.ts#L48), [:109](../backend/src/auth/auth.service.ts#L109), [:162](../backend/src/auth/auth.service.ts#L162) `console.log` the verification token and email-change token together with the user's email address. No mail transport exists. Effects:

- No user can ever verify their email (the admin panel shows every account as "⚠ Unverified", see B16).
- "Request email change" in Profile can never complete.
- Server logs contain PII and bearer-equivalent secrets, which matters for retention, log shipping and Sentry breadcrumbs.
- There is **no password-reset flow** at all, either backend or UI (see F1).

Fix: integrate a transactional mail provider, stop logging tokens, and gate "unverified" UI states until email works.

### B5 — Report and contact emails are undeliverable · High

- The "🚩 Flag" link in every map popup is `mailto:support@colours-of-safety.org`. **`colours-of-safety.org` does not exist (NXDOMAIN)**, so every abuse report is lost. Source: [map.ts:980](../frontend/src/app/map/map.ts#L980).
- The privacy policy lists `privacy@coloursofsafety.com`, but `coloursofsafety.com` has **no MX record**. GDPR requests cannot reach you.
- Fix: set up email routing (e.g. Cloudflare Email Routing) and use one domain. Better still, replace mailto flagging with an in-app report endpoint that feeds the review queue (see F4).

### B6 — Malformed canonical and `og:url` · High

On every route except `/`, the canonical is `https://coloursofsafety.com` + path **without a slash**. The browser then resolves it to e.g. `https://coloursofsafety.comlogin/`, `https://coloursofsafety.complace/<id>`, which is a different host. Search engines will ignore or misattribute these pages, and social shares get a broken `og:url`.

- Cause: [seo.resolver.ts](../frontend/src/app/core/seo.resolver.ts): `` `https://coloursofsafety.com${route.url.join('/')}` ``.
- Fix: `` `https://coloursofsafety.com/${route.url.map(s => s.path).join('/')}` `` (note that `route.url` is `UrlSegment[]`). FAQ already sets its own correct canonical.

### B7 — "0 safe spaces mapped" counter · Medium

The social-proof counter in the legend always shows **0**, even with 2 243 places and 77 districts on the map. The initial load at [map.ts:721](../frontend/src/app/map/map.ts#L721) sets `allPois` but never updates `approvedCount`. Only `reloadStats()` does, and it runs only after a successful submission. A counter that reads 0 is worse than no counter.

### B8 — Token in localStorage without CSP · High

After login the JWT is stored in `localStorage` (`cos.token`, `cos.user`). No cookies are used. Any XSS can therefore exfiltrate the session, and there is no Content-Security-Policy to limit that. User-provided content is rendered in popups and profiles (names, descriptions, bio, **arbitrary avatar URLs**), so XSS surface exists.

Fix: move the session to an `HttpOnly; Secure; SameSite=Strict` cookie, or at minimum ship a strict CSP (see B9).

### B9 — Missing security headers · Medium

HTML responses from nginx have **no** `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` or `X-Frame-Options`/`frame-ancestors`. API responses advertise `X-Powered-By: Express`. There is also no `/.well-known/security.txt`, and the SPA fallback returns index.html for it.

Fix: add headers in [nginx.conf](../frontend/nginx.conf) (or Cloudflare transform rules), use `app.disable('x-powered-by')` / `helmet` in the backend, and publish `security.txt`.

### B10 — Soft 404s · Medium

Any unknown path (e.g. `/does-not-exist`, `/logo.png`, `/manifest.json`) returns **HTTP 200** with the SPA. Angular's `**` route then silently redirects to the map. Users get no "page not found" message and crawlers index junk URLs. Fix: add a NotFound component with `noindex`. Ideally nginx should also return 404 for missing static-file extensions.

### B11 — Guard redirects · Low

- Logged-out visits to `/review` and `/admin` silently land on the map. They should redirect to `/login` or show a message.
- `/mine`, `/profile` and `/my-edits` redirect to `/login`, but after logging in the user is sent to `/` instead of the page they asked for. Add a `returnUrl`.
- `/my-edits` is missing from `robots.txt` Disallow (it does carry a noindex meta, so this is minor).

### B12 — Seeded data quality · High

Of the 2 243 approved places, **790 have the description "Sourced from Wikidata: http://…"** as their only text, and many are clearly not queer venues: *Vietnam National Museum of Fine Arts*, *Royal Museums of Fine Arts of Belgium*, *East Side Gallery*, *Brücke Museum*, *National Art Museum of Ukraine* and others. They are all categorised as **"Community Space"** with safety rating 4 ("Friendly").

Rating distribution is 1 216 × 4 and 1 007 × 5, with only 20 places rated 1–3. The ratings were therefore assigned by the seeder, not by the community, yet they are presented with the same authority as community ratings. On a *safety* map this is a trust problem: users may rely on a "Friendly" label that nobody verified. There are also 3 near-duplicate entries (same name and location).

Fix: re-audit the Wikidata query (it likely matched any LGBT-*related* item, such as museums with LGBT exhibitions), mark seeded entries visibly as "Imported — not yet community-verified", hide the rating until community votes exist, render the Wikidata URL as a link, and de-duplicate.

### B13 — Broken or missing assets · Low

| URL | Status |
|---|---|
| `/logo.png` (referenced in Organization JSON-LD) | missing → SPA fallback |
| `/apple-touch-icon.png` (referenced in `<head>`) | missing → SPA fallback |
| `/manifest.webmanifest` / `/manifest.json` | missing, so the site isn't installable as a PWA |
| `/favicon.ico` | 134 KB. Replace with a small multi-size ICO plus an SVG icon. |

The sitemap lists only 5 static URLs, with no `lastmod` and no place pages (blocked by B3).

### B14 — Tracking before and despite consent · Medium

- `googletagmanager.com/gtag/js` loads on first visit **before** any consent choice, and still loads after clicking **Reject**. No GA `collect` hits were observed (Consent Mode appears to default to denied), but loading GTM already transmits the visitor's IP to Google.
- Sentry error and performance envelopes (`tracesSampleRate: 1.0`) are sent regardless of consent. Session Replay is correctly gated on consent in [main.ts](../frontend/src/main.ts).
- The banner says "We use cookies for essential features and analytics", but no cookies are set at all (the app uses localStorage).

For an audience at elevated risk, don't load GTM until the user accepts, and make sure the privacy policy mentions Sentry as a processor.

### B15 — Auth form feedback · Medium

- Submitting **empty** login/register forms does nothing visible: there are no `required` attributes, no error text and no `aria-invalid`.
- Register with a 3-character password also gives no feedback. The "At least 8 characters" hint is not enforced client-side.
- After a failed login ("Invalid email or password."), focus falls to `<body>`. Move focus to the error or the first field, and ensure the error has `role="alert"`.
- Register pronouns dropdown has both "Prefer not to say / skip" and "Prefer not to say". This is a duplicate option.
- No "Forgot password?" link (see F1). No link to the privacy policy or terms at sign-up.

### B16 — Admin panel observations · Low

- All 9 accounts show "⚠ Unverified", including admins, because of B4.
- Test accounts (`Tester 499e9142`, `Tester 251b526f`, …, `Devin Evidence`) exist in the production database. Clean them up and point e2e tests at a staging environment.
- The role selector and **Ban** button are rendered on your own "(you)" card. They are disabled in code (`isCurrentUser`), so this is cosmetic only. Consider hiding them.
- A client-side search exists, but there is no server-side pagination. This won't scale beyond a few hundred users.
- `/my-edits` shows the same "Ixelles" district edit twice with identical dates (possible duplicate submission).

---

## Accessibility

axe-core counts per page (serious impact): `color-contrast` 3–16 nodes, `link-in-text-block` 1, `aria-dialog-name` 1. No critical-impact violations were detected automatically, but the most important problems are map-specific and invisible to axe.

### A1 — Places on the map are unreachable by keyboard and screen reader · High (WCAG 2.1.1, 4.1.2, A)
All 2 320 places and districts are rendered as SVG `<path class="leaflet-interactive">` with no `tabindex`, `role` or accessible name. Keyboard users can pan and zoom the map but can never open a single place. Screen-reader users get "Interactive safety map, application" and nothing else. *(Still open from ACCESSIBILITY_AUDIT C1.)*
**Fix:** provide a synchronized **list view** of places in the current viewport (name, category, rating, distance) with keyboard-operable items that open the popup. Also consider `L.marker` with focusable `divIcon`s or `keyboard: true` handling for circle markers.

### A2 — Colour-blind symbols promised but not rendered · High (WCAG 1.4.1, A)
The legend says "Symbols help colour-blind users: ✕ unsafe, △ caution, ◆ mixed, ✓ friendly, ★ welcoming". The markers on the map, however, are plain filled circles distinguished **only by colour** (and green/yellow-green are hard to tell apart even for typical vision). The symbols appear only inside the legend and popup. *(Still open from C5.)* Render the symbol inside each marker (`divIcon`), or vary the shape.

### A3 — Primary brand colour fails contrast · Medium (1.4.3, AA)
`#ffffff` on `#e84393` = **3.71:1** (needs 4.5:1). This affects the "Sign up" CTA, every submit button, `.primary` buttons, and the pink "Sign up" link on white. `#e84393` on the dark footer = 4.4:1 ("❤ Support us"). A darker pink such as `#c2185b` (≈5.6:1 with white) keeps the brand feel.

### A4 — Other contrast failures · Medium (1.4.3)
- Form hint text `#9498a8` on white = 2.87:1 (register "At least 8 characters", profile).
- Status chips on `/my-edits` (14 nodes) and role badges and "Unverified" chips on `/admin` (16 nodes).
- Active filter tab in `/review`.

### A5 — Cookie banner · Medium
- `role="dialog"` without an accessible name (`aria-dialog-name`). Add `aria-labelledby` or `aria-label="Cookie consent"`.
- It is **last** in tab order (after ~20 stops) although it visually overlays the page. Move it to the start of the DOM or focus it on appearance.
- The "Learn more" link (`#74b9ff` on white text context) is distinguishable only by colour (2.07:1 against the surrounding text). Underline it.
- On mobile it covers ~20% of the viewport, including the footer.

### A6 — Home page has no `<h1>` · Medium (1.3.1, 2.4.6)
The map page's only heading is `<h3>Safety rating</h3>`. Add a visually-hidden `<h1>` ("Colours of Safety — map of queer-friendly places") and make the legend heading an `h2`.

### A7 — Popups don't manage focus · Medium (2.4.3)
Opening a popup leaves focus on the map container. Its content (Flag link, close button) is not announced, and closing does not return focus. Move focus into the popup on open and restore it on close. (Escape-to-close works.)

### A8 — Tab order doesn't match visual order · Low (2.4.3)
Order is: header → map container → zoom controls → **"Leaflet" attribution link** → search → filters → legend → footer → cookie banner. The search and filter panel is visually first and should come before the map. The Leaflet attribution link probably shouldn't be an early tab stop.

### A9 — No status announcements for map changes · Low (4.1.3)
Search, geolocate and filter changes update the map silently. The only live region on the page belongs to the cookie banner. Announce e.g. "Showing 42 places near Berlin" through an `aria-live="polite"` region. The "Location not found." message should be `role="alert"`.

### A10 — Emoji used as UI icons · Low
The search button is 🔍, locate is 📍, the theme toggle is 🔆, and the draw tools use ⬟/○. They do have `aria-label`s (good), but emoji render inconsistently across platforms and are read aloud in some contexts (e.g. "❤ Support us", "🚩 Flag"). Wrap decorative emoji in `aria-hidden="true"` spans and prefer SVG icons.

### A11 — Mobile layout crowds the map · Low
At 390 px width the filter panel and legend together cover about 60% of the map. The filter panel also overlaps the zoom control, and the brand name is hidden. Make the filters collapsible ("Filters ▾") and the legend a toggle.

### A12 — Draw tools use jargon · Low
Logged-in users see Leaflet.draw tooltips "Draw a polygon" / "Draw a **circlemarker**", and clicking the map does nothing on its own. Rename them to "Add a place" and "Draw a district", and add a clearer "+ Add place" button (the hint text currently points to "tools in the top-right" as tiny icons).

Positive notes: the skip link, landmarks (`header`/`nav`/`main`/`footer`), `lang="en"`, labelled inputs/selects, visible focus outlines, `autocomplete` attributes on auth fields, Escape closing popups, and a high-contrast theme toggle are all present.

---

## Missing Features

| # | Feature | Why it matters |
|---|---|---|
| F1 | **Password reset** ("Forgot password?") | No way to recover an account; nothing exists in backend or UI. Depends on B4. |
| F2 | **Working place detail pages** with a shareable URL, address, opening hours, website and directions | Blocked by B3. They're the foundation for sharing, SEO (sitemap of places) and reviews. |
| F3 | **List view / search results** of places in view | Accessibility (A1), and far faster than hunting markers on mobile. |
| F4 | **In-app report/flag** feeding the moderation queue | Replaces the broken mailto (B5); lets reviewers act on reports. |
| F5 | **Community ratings and reviews** on places | Ratings are currently seeder-assigned (B12). A vote count exists in the data (`voteCount: 0` everywhere) but there's no UI to vote. |
| F6 | **Marker clustering (not active in production)** | [map.ts:156](../frontend/src/app/map/map.ts#L156) falls back to a plain layer when `L.markerClusterGroup` is unavailable, and production shows no cluster icons, so the fallback is being taken. All 2 320 shapes render at once (3.1 MB JSON, 140 KB brotli). Overlapping markers in dense areas (e.g. central Brussels) are impossible to click individually. |
| F7 | **URL state for the map** (`?lat=&lng=&z=&category=`) | The URL never changes when panning, searching or filtering, so a view can't be shared or bookmarked, and Back doesn't work. |
| F8 | **Search autocomplete** and search over *place names* | Search currently only geocodes cities/addresses, so you can't search for "Comptons of Soho". |
| F9 | **"Quick exit" / panic button** and discreet mode | Standard on safety resources for at-risk users (e.g. on a shared device). Could also offer a neutral tab title. |
| F10 | **Localisation** | The audience is worldwide (data spans Vietnam, Brazil, Ukraine, Germany…) but the UI is English-only. |
| F11 | **PWA / offline** | No manifest or service worker. Offline access to saved places matters when travelling. |
| F12 | **Favourites / saved places** | Useful for travellers; nothing like it exists yet. |
| F13 | **"Last verified" date and source label** per place | Needed so users can judge how current and trustworthy a safety label is. |
| F14 | **Proper 404 page** | See B10. |

---

## Recommended Priority

1. **Now (security/privacy):** B1, B2, B4 (stop logging tokens), B5, B8/B9.
2. **Next (core broken features):** B3 + F2, B7, B6, B15, F1.
3. **Trust:** B12 (label or hide seeded ratings), F4, F5.
4. **Accessibility:** A1 + F3, A2, A3, A5, A6, A7.
5. **Polish and growth:** B10, B11, B13, B14, F6–F13.
