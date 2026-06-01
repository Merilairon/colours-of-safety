# Architecture — Colours of Safety

## 1. Overview

Community map for marking LGBTQIA+ safe places and districts on OpenStreetMap.
Public read, authenticated write, reviewer moderation.

**Production URL:** `coloursofsafety.com`

---

## 2. Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Frontend      | Angular 21, Leaflet + leaflet-draw, SCSS                |
| Backend       | NestJS 11, TypeORM, Passport-JWT                        |
| Database      | PostgreSQL 16 + PostGIS 3.4                             |
| Container     | Docker / nginx (SPA + `/api` proxy)                     |
| Orchestration | Kubernetes (k3s), namespace `colours-of-safety`         |
| Ingress       | Cloudflare Tunnel (HTTP, no TLS termination at cluster) |
| CI/CD         | GitHub Actions → GHCR → k3s via ARC runner              |

---

## 3. High-Level Component Diagram

```
Browser
  │  HTTPS
  ▼
Cloudflare Tunnel Ingress  (coloursofsafety.com → frontend:80)
  │
  ▼
frontend Pod  (nginx)
  ├── static SPA  (Angular, /*)
  └── /api/*  → proxy_pass → backend:3000
                    │
                    ▼
              backend Pod  (NestJS :3000)
                    │
                    ▼
              postgres Pod  (PostGIS :5432, PVC 5Gi)
```

---

## 4. Backend (`./backend`)

### 4.1 Module Structure

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule (PostgreSQL/PostGIS, pool 10)
├── UsersModule
├── AuthModule
├── PoisModule
├── DistrictsModule
└── SeedService  (creates default reviewer + super_admin on first boot)
```

### 4.2 Domain Entities

**`users`**

| Column       | Type             | Notes                                      |
| ------------ | ---------------- | ------------------------------------------ |
| id           | uuid (PK)        |                                            |
| email        | varchar (unique) | Excluded from API responses                |
| displayName  | varchar          |                                            |
| passwordHash | varchar          | Excluded from API responses                |
| role         | enum             | `user`, `reviewer`, `admin`, `super_admin` |
| createdAt    | timestamptz      |                                            |

**`pois`**

| Column       | Type                        | Notes                             |
| ------------ | --------------------------- | --------------------------------- |
| id           | uuid (PK)                   |                                   |
| name         | varchar                     |                                   |
| description  | text                        |                                   |
| category     | varchar                     | default `other`                   |
| safetyRating | int                         | 1 (unsafe) – 5 (very safe)        |
| location     | geometry(Point, 4326)       | Spatial index                     |
| status       | enum                        | `pending`, `approved`, `rejected` |
| reviewNote   | text (nullable)             |                                   |
| createdById  | uuid (FK → users)           | CASCADE delete                    |
| reviewedById | uuid (FK → users, nullable) | SET NULL on delete                |
| createdAt    | timestamptz                 |                                   |
| updatedAt    | timestamptz                 |                                   |

**`districts`** — identical shape to `pois`, geometry column is `Polygon` named `area`.

### 4.3 Auth

- JWT Bearer tokens, signed with `JWT_SECRET`, default expiry `7d`
- `JwtAuthGuard` — requires valid token
- `RolesGuard` + `@Roles()` decorator — enforces minimum role
- Passwords hashed with bcrypt

### 4.4 REST API

Base prefix: `/api`

| Method | Route                   | Auth     | Description                     |
| ------ | ----------------------- | -------- | ------------------------------- |
| POST   | `/auth/register`        | public   | Create account                  |
| POST   | `/auth/login`           | public   | Returns `{ accessToken, user }` |
| GET    | `/auth/me`              | user     | Current user                    |
| GET    | `/pois`                 | public   | Approved POIs                   |
| GET    | `/pois/mine`            | user     | Caller's own submissions        |
| GET    | `/pois/pending`         | reviewer | Moderation queue                |
| POST   | `/pois`                 | user     | Submit new POI                  |
| PATCH  | `/pois/:id/review`      | reviewer | Approve / reject                |
| GET    | `/districts`            | public   | Approved districts              |
| GET    | `/districts/mine`       | user     | Caller's own submissions        |
| GET    | `/districts/pending`    | reviewer | Moderation queue                |
| POST   | `/districts`            | user     | Submit new district             |
| PATCH  | `/districts/:id/review` | reviewer | Approve / reject                |
| GET    | `/users`                | admin    | List users                      |
| PATCH  | `/users/:id/role`       | admin    | Change user role                |

Geometries: GeoJSON `Point` (POIs) / `Polygon` (districts), SRID 4326.

---

## 5. Frontend (`./frontend`)

### 5.1 Route Structure

| Path        | Component                | Guard           |
| ----------- | ------------------------ | --------------- |
| `/`         | `MapComponent`           | none (public)   |
| `/login`    | `LoginComponent`         | none            |
| `/register` | `RegisterComponent`      | none            |
| `/mine`     | `MySubmissionsComponent` | `authGuard`     |
| `/review`   | `ReviewComponent`        | `reviewerGuard` |

All lazy-loaded; wildcard → `/`.

### 5.2 Core Services

- **`AuthService`** — signal-based state (`_user`, `isLoggedIn`, `isReviewer`), token persisted in `localStorage` under keys `cos.token` / `cos.user`
- **`MarkingsService`** — CRUD for POIs and districts via `/api/pois` and `/api/districts`
- **`AuthInterceptor`** — attaches `Authorization: Bearer <token>` to every request

### 5.3 Map

`MapComponent` uses Leaflet + leaflet-draw. POIs rendered as markers, districts as polygons, colour-coded by `safetyRating` (1–5 scale via `safety.ts` helpers).

---

## 6. Infrastructure (`./k8s`)

All resources live in namespace `colours-of-safety`.

| Manifest                        | Resource(s)                                       |
| ------------------------------- | ------------------------------------------------- |
| `namespace.yml`                 | Namespace                                         |
| `postgres.yml`                  | PVC (5 Gi), Deployment, Service :5432             |
| `backend.yml`                   | Deployment (1 replica), Service :3000             |
| `frontend.yml`                  | Deployment (1 replica), Service :80               |
| `frontend-nginx-configmap.yml`  | nginx config — SPA fallback + `/api` proxy        |
| `cloudflare-tunnel-ingress.yml` | Ingress → `frontend:80` for `coloursofsafety.com` |
| `arc-runner.yml`                | ARC RunnerDeployment + RBAC for CI/CD             |
| `secrets.yml.example`           | Template for `app-secrets` Secret                 |

Secrets (DB credentials, JWT secret, seeded account passwords) are stored as a Kubernetes `Secret` named `app-secrets`.

Images pulled from GHCR (`ghcr.io/merilairon/colours-of-safety-{backend,frontend}`) using `ghcr-pull-secret`.

---

## 7. CI/CD (`.github/workflows/deploy.yml`)

Trigger: push to `main`.

```
build-and-push job  (ubuntu-latest / GHCR)
  1. Build & push backend image  → :latest + :<sha>
  2. Build & push frontend image → :latest + :<sha>
          │
          ▼
deploy job  (self-hosted ARC runner, label: colours-of-safety)
  1. kubectl apply namespace, configmap, ingress
  2. kubectl apply postgres
  3. kubectl apply backend → set image to :<sha>
  4. kubectl apply frontend → set image to :<sha>
  5. kubectl rollout status (timeout 120 s each)
```

ARC runner uses the `colours-of-safety-runner` ServiceAccount which has `ClusterRole` `colours-of-safety-deployer` (get/list/watch/create/update/patch on Deployments, Services, Ingresses, ConfigMaps, Secrets, PVCs, Namespaces).

---

## 8. Local Development

### Docker Compose (fastest)

```bash
cp .env.example .env
docker compose up --build
# → http://localhost:8080
```

### Without Docker

Requires Node 22+, PostGIS Postgres.

```bash
# Backend :3000
cd backend && npm install && npm run start:dev

# Frontend :4200 (proxies /api → :3000)
cd frontend && npm install && npm start
```

### Seeded Accounts

| Role        | Email                            | Password        |
| ----------- | -------------------------------- | --------------- |
| reviewer    | `reviewer@coloursofsafety.com`   | `reviewer123`   |
| super_admin | `superadmin@coloursofsafety.com` | `superadmin123` |

> Change all credentials and `JWT_SECRET` before production use.

---

## 9. Security Notes

- `email` and `passwordHash` excluded from all API responses via `ClassSerializerInterceptor` + `@Exclude()`
- `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true` on all endpoints
- CORS enabled with `origin: true` (restrict in production)
- TypeORM `synchronize: true` — disable or replace with migrations in production
