# Colours of Safety 🏳️‍🌈

A community map for marking **queer-friendly (LGBTQIA+ safe)** places and districts on
OpenStreetMap. Anyone can browse approved markings; logged-in users can submit new ones,
and **reviewers** moderate submissions before they appear publicly.

## Features

- 🗺️ Interactive OpenStreetMap (Leaflet) with colour-coded safety ratings
- 📍 Mark **POIs** (places) by dropping a point, or **districts** by drawing a polygon
- 🔐 Email/password auth (JWT). Viewing is public; marking requires an account
- ✅ Reviewer moderation queue — only **approved** markings show on the public map
- 📋 "My submissions" view so contributors can track review status
- 🐘 PostgreSQL + **PostGIS** for geospatial storage
- 🐳 One-command deploy with `docker compose`

## Tech stack

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Frontend | Angular 21, Leaflet + leaflet-draw, TypeScript         |
| Backend  | NestJS 11, TypeORM, Passport JWT                       |
| Database | PostgreSQL 16 + PostGIS 3.4                            |
| Deploy   | Docker Compose (nginx serves the SPA + proxies `/api`) |

## Quick start (Docker Compose)

```bash
cp .env.example .env        # optional: tweak credentials / ports
docker compose up --build
```

Then open **http://localhost:8080**.

A default reviewer account is seeded on first boot (configurable in `.env`):

- **Email:** `reviewer@coloursofsafety.com`
- **Password:** `reviewer123`

> Change `JWT_SECRET` and the reviewer credentials before deploying anywhere real.

## How it works

1. Sign up / log in.
2. On the map, use the top-right tools to drop a **place** (◯) or draw a **district** (▱).
3. Fill in the name, category, safety rating (1–5) and optional notes, then submit.
4. The submission is created with status `pending` and is **not** shown publicly yet.
5. A reviewer opens the **Review queue**, then approves or rejects it (with an optional note).
6. Approved markings appear on the public map, colour-coded by safety rating.

## API overview

All routes are prefixed with `/api`.

| Method | Route                                        | Auth     | Description                      |
| ------ | -------------------------------------------- | -------- | -------------------------------- |
| POST   | `/auth/register`                             | –        | Create an account                |
| POST   | `/auth/login`                                | –        | Log in, returns a JWT            |
| GET    | `/auth/me`                                   | user     | Current user                     |
| GET    | `/pois` · `/districts`                       | –        | Public: **approved** markings    |
| GET    | `/pois/mine` · `/districts/mine`             | user     | Caller's own submissions         |
| GET    | `/pois/pending` · `/districts/pending`       | reviewer | Moderation queue                 |
| POST   | `/pois` · `/districts`                       | user     | Submit a new marking (`pending`) |
| PATCH  | `/pois/:id/review` · `/districts/:id/review` | reviewer | Approve / reject                 |

Geometries are exchanged as GeoJSON (`Point` for POIs, `Polygon` for districts, SRID 4326).

## Local development (without Docker)

Requires Node 22+ and a PostGIS-enabled Postgres instance.

```bash
# Backend (http://localhost:3000)
cd backend
npm install
# set DB_HOST / DB_USERNAME / DB_PASSWORD / DB_NAME / JWT_SECRET in your env
npm run start:dev

# Frontend (http://localhost:4200, proxies /api -> :3000)
cd frontend
npm install
npm start
```

### Useful commands

```bash
# Backend
cd backend && npm run lint && npm run build && npm test

# Frontend
cd frontend && npm run build && npm test
```

## Configuration

See [`.env.example`](./.env.example) for all variables (DB credentials, `JWT_SECRET`,
`JWT_EXPIRES_IN`, seeded reviewer account, and `FRONTEND_PORT`).

## Licence

- **Application code** — [AGPL-3.0](./LICENSE)
- **Community map data** — [ODbL 1.0](./LICENSE-DATA)
