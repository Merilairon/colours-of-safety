# Colours of Safety — UI Design Documentation

## Overview

**Colours of Safety** is a community map for marking LGBTQIA+-friendly places and districts. The UI is a single-page Angular application with a persistent top navigation bar and a full-height content area.

---

## Design Tokens

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Brand / Accent | `#e84393` | CTA buttons, active nav underline, focus rings, `reviewer` badge, form accents |
| Dark background | `#1d1f2b` | Topbar background |
| Body text (dark) | `#3a3d4d` | Form labels, draft panel text |
| Muted text | `#6b6f80` | Subtitles, meta, legend note, secondary info |
| Nav link (inactive) | `#c7c9d9` | Nav anchors, account links |
| White | `#ffffff` | Nav active/hover, card backgrounds |
| Card border | `#d4d6e0` | Form input borders |
| Secondary button bg | `#eceef4` | "Cancel" / secondary actions |

### Safety Rating Colours

| Rating | Label | Hex |
|---|---|---|
| 1 | Unsafe | `#d7263d` |
| 2 | Caution | `#f46036` |
| 3 | Mixed | `#f4c430` |
| 4 | Friendly | `#7cb518` |
| 5 | Very welcoming | `#2e933c` |

These colours are applied as circle marker fills (POIs), polygon shading (districts), rating badge backgrounds (review queue), and coloured label text (submissions list).

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Topbar (56px, #1d1f2b)                             │
│  [🏳️‍🌈 Colours of Safety]  [Map] [My submissions]    │
│                           [Review queue*]  [User ▸] │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                                                     │
│  <router-outlet>  (flex: 1, overflow: auto)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

*"Review queue" nav link only visible to users with `role === 'reviewer'`.

---

## Screens

### 1. Map (`/`)

Full-height interactive Leaflet map (OpenStreetMap tiles). Default centre: Brussels `[50.85, 4.35]`, zoom 12.

**Overlays**

| Element | Position | Condition |
|---|---|---|
| Legend card | Bottom-left | Always |
| Hint pill | Top-centre | Not logged in, or logged in with no active draft |
| Load-error pill | Top-centre | Map data failed to load |
| Toast notification | Bottom-centre | After successful submission |
| Draft panel | Top-right | After drawing a shape |
| Leaflet draw toolbar | Top-right | Logged-in users only |

**Legend card**

Floating white card (`border-radius: 10px`, subtle shadow). Lists all 5 safety ratings as coloured circle swatches with labels. Footer note: `Markers = places · Shaded areas = districts`.

**Hint pill**

Dark pill (`#1d1f2b` at 92% opacity, `border-radius: 999px`). Messages:
- Logged out: "Log in to mark a queer-friendly place or district."
- Logged in, no draft: "Use the tools in the top-right to drop a place (◯) or draw a district (▱)."
- Error state: pill turns `#d7263d`.

**Toast notification**

Green pill (`#2e933c`) centred at the bottom, shown after a successful submit.

**Draft panel**

White card (`width: 320px`, `border-radius: 12px`, strong shadow) slides in top-right after drawing. Contains:

- Title: "New place" or "New district"
- Subtitle: "It will be visible publicly once a reviewer approves it."
- **Name** — text input (required, min 2 chars)
- **Category** — `<select>` (POI only). Options: `bar`, `cafe`, `restaurant`, `club`, `community`, `healthcare`, `shop`, `other`
- **Safety rating** — range slider 1–5, accent `#e84393`, live label shows current rating text
- **Notes** — optional textarea (3 rows), placeholder: "Why is this place safe / welcoming?"
- **Actions row** — "Cancel" (secondary, `#eceef4`) + "Submit for review" (primary, `#e84393`)

**Map markers / polygons**

Approved POIs render as circle markers. Approved districts render as filled polygons. Both are colour-coded by `safetyRating` using the safety palette. Leaflet popups show name, category/meta, description. Draw tools allow: circle-marker (pink `#e84393`) and polygon (pink, no self-intersect).

---

### 2. Login (`/login`)

Centred auth card. Fields: **Email**, **Password**. Inline error message on 401. Submit button: "Log in" / "Logging in…". Footer link to `/register`.

---

### 3. Register (`/register`)

Centred auth card. Fields: **Display name**, **Email**, **Password** (min 8 chars, hint shown). Inline error on 409 (email taken). Submit button: "Sign up" / "Creating account…". Footer link to `/login`.

---

### 4. My Submissions (`/mine`) — auth-guarded

Page with `h1` "My submissions" and subtitle. Lists all POIs and districts submitted by the current user, sorted newest-first.

**Row layout** (each `<li class="row">`)

- **Kind badge** — `Place` or `District`
- **Name** (bold)
- **Meta line** — category · safety label (coloured with `safetyColor`)
- **Reviewer note** — shown if present ("Reviewer: "…"")
- **Status badge** — `pending` / `approved` / `rejected` (CSS class applied for per-status styling)

Empty state: links back to the map.

---

### 5. Review Queue (`/review`) — reviewer-guarded

Page with `h1` "Review queue" and subtitle. Shows pending POIs and districts fetched simultaneously.

**Card layout** (each `<li class="card">`)

- **Card head row** — kind badge (`Place` / `District`) + safety rating badge (background = `safetyColor`, text = `safetyLabel`)
- **Name** (`h2`)
- **Meta** — category · "by {author display name}"
- **Description** — shown if present
- **Review note textarea** — optional, 2 rows
- **Actions row** — "Reject" + "Approve" buttons; both disabled while request in flight

Empty state: "Nothing to review right now. 🎉"

---

## Component Hierarchy

```
App (shell + topbar)
├── MapComponent         /
├── LoginComponent       /login
├── RegisterComponent    /register
├── MySubmissionsComponent  /mine   [authGuard]
└── ReviewComponent      /review   [reviewerGuard]
```

---

## User Roles & Conditional UI

| UI element | Guest | User | Reviewer |
|---|---|---|---|
| Browse map (approved markings) | ✅ | ✅ | ✅ |
| Draw / submit marking | ❌ | ✅ | ✅ |
| "My submissions" nav link | ❌ | ✅ | ✅ |
| "Review queue" nav link | ❌ | ❌ | ✅ |
| `reviewer` badge in topbar | ❌ | ❌ | ✅ |

---

## Topbar

Height `56px`, background `#1d1f2b`, horizontal flex layout.

- **Brand** — rainbow flag emoji + "Colours of Safety", bold white, links to `/`
- **Nav** — "Map" always; "My submissions" when logged in; "Review queue" when reviewer. Active link underlined with `#e84393` (2px bottom border)
- **Account area** (right-aligned):
  - *Logged out*: "Log in" link + "Sign up" CTA button (`#e84393` bg)
  - *Logged in*: display name (bold) · optional `reviewer` pill badge (`#e84393`) · "Log out" text button

---

## Forms — Shared Patterns

- Reactive Forms (Angular `FormBuilder.nonNullable`)
- Labels wrap inputs (`flex-direction: column`, `gap: 0.3rem`)
- Focus ring: `border-color: #e84393`, `box-shadow: 0 0 0 3px rgba(232,67,147,.15)`
- Error messages: `<p class="error">` in accent red (`#d7263d`)
- Submit buttons disabled + show "…" label while `submitting` signal is true
- Auth card: centred, white, rounded, shadow (shared `auth.scss`)
