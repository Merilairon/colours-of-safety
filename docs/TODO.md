# Colours of Safety — Project TODOs

## SEO

### Phase 1 — Critical (Week 1)

- [x] Update `index.html` with full meta tags (SEO_DOCUMENTATION §3.1)
- [x] Create `robots.txt` (SEO_DOCUMENTATION §3.2)
- [x] Create `sitemap.xml` (SEO_DOCUMENTATION §3.3)
- [x] Add Open Graph image asset (1200×630px)

### Phase 2 — High Impact (Week 2)

- [ ] Install Angular SSR (`ng add @angular/ssr`)
- [x] Implement `SeoService` (SEO_DOCUMENTATION §6.2)
- [x] Add route-level SEO data (SEO_DOCUMENTATION §6.4)
- [x] Add JSON-LD structured data (SEO_DOCUMENTATION §4)

### Phase 3 — Optimization (Week 3–4)

- [ ] Performance audit and fixes (SEO_DOCUMENTATION §8)
- [x] Preconnect to tile server (SEO_DOCUMENTATION §8)
- [ ] Content enhancements (SEO_DOCUMENTATION §7.1)
- [ ] Google Search Console setup
- [ ] Analytics implementation

---

## Security / Pre-Production Hardening

> **Note:** These are deployment-time configurations, not code changes. Documented in `k8s/secrets.yml.example`.

- [ ] Rotate seeded credentials — `reviewer123` / `superadmin123` must not be used in production (ARCHITECTURE §8)
- [ ] Rotate `JWT_SECRET` — replace dev default before production deployment (ARCHITECTURE §8)
- [ ] Restrict CORS — change `origin: true` to production domain only (ARCHITECTURE §9)
- [ ] Replace TypeORM `synchronize: true` with proper migrations (ARCHITECTURE §9)

---

## Missing Infrastructure

- [x] Create `k8s/namespace.yml` — exists in repo
- [x] Create `k8s/postgres.yml` — exists in repo
- [ ] Create `k8s/secrets.yml` from `k8s/secrets.yml.example` on each target cluster (deployment step)

---

## Missing Features

- [x] Admin UI — `GET /users` and `PATCH /users/:id/role` backend routes exist but no frontend screen is implemented or documented for the `admin` role
  - Created `/admin` route with `AdminComponent`
  - Added `UserService` for API calls
  - Added `adminGuard` for route protection
  - Added navigation link for admin users
