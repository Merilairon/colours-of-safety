# Colours of Safety — UI Design Documentation

## Overview

**Colours of Safety** is a community map for marking LGBTQIA+-friendly places and districts. The UI is a single-page Angular application with a persistent top navigation bar and a full-height content area.

---

## Design Tokens

### Colour Palette

| Token               | Hex       | Usage                                                                          |
| ------------------- | --------- | ------------------------------------------------------------------------------ |
| Brand / Accent      | `#e84393` | CTA buttons, active nav underline, focus rings, `reviewer` badge, form accents |
| Dark background     | `#1d1f2b` | Topbar background                                                              |
| Body text (dark)    | `#3a3d4d` | Form labels, draft panel text                                                  |
| Muted text          | `#6b6f80` | Subtitles, meta, legend note, secondary info                                   |
| Nav link (inactive) | `#c7c9d9` | Nav anchors, account links                                                     |
| White               | `#ffffff` | Nav active/hover, card backgrounds                                             |
| Card border         | `#d4d6e0` | Form input borders                                                             |
| Secondary button bg | `#eceef4` | "Cancel" / secondary actions                                                   |

### Safety Rating Colours

| Rating | Label          | Hex       |
| ------ | -------------- | --------- |
| 1      | Unsafe         | `#d7263d` |
| 2      | Caution        | `#f46036` |
| 3      | Mixed          | `#f4c430` |
| 4      | Friendly       | `#7cb518` |
| 5      | Very welcoming | `#2e933c` |

These colours are applied as circle marker fills (POIs), polygon shading (districts), rating badge backgrounds (review queue), and coloured label text (submissions list).

**Colorblind Accessibility:** Each rating must have a secondary visual indicator (icon or pattern) alongside color. The red-green scale (`#d7263d` → `#2e933c`) is problematic for deuteranopia/protanopia (~8% of males).

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

\*"Review queue" nav link only visible to users with `role === 'reviewer'`.

---

## Screens

### 1. Map (`/`)

Full-height interactive Leaflet map (OpenStreetMap tiles). Default centre: Brussels `[50.85, 4.35]`, zoom 12.

**Overlays**

| Element              | Position      | Condition                                        |
| -------------------- | ------------- | ------------------------------------------------ |
| Legend card          | Bottom-left   | Always                                           |
| Hint pill            | Top-centre    | Not logged in, or logged in with no active draft |
| Load-error pill      | Top-centre    | Map data failed to load                          |
| Toast notification   | Bottom-centre | After successful submission                      |
| Draft panel          | Top-right     | After drawing a shape                            |
| Leaflet draw toolbar | Top-right     | Logged-in users only                             |

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
- **Category** — `<select>` (POI only). Options: `bar`, `cafe`, `restaurant`, `club`, `community`, `healthcare`, `shop`, `bookstore`, `youth_center`, `support_group`, `hiv_sti_testing`, `transgender_services`, `crisis_shelter`, `legal_aid`, `religious_spiritual`, `sexual_health_clinic`, `other`
- **Safety rating** — range slider 1–5, accent `#e84393`, live label shows current rating text
- **Wheelchair accessible** — checkbox toggle (optional)
- **Submit anonymously** — checkbox toggle. When checked, submission displays "Anonymous" instead of user's `displayName`
- **Notes** — optional textarea (3 rows), placeholder: "Why is this place safe / welcoming?"
- **Actions row** — "Cancel" (secondary, `#eceef4`) + "Submit for review" (primary, `#e84393`)

**Map markers / polygons**

Approved POIs render as circle markers. Approved districts render as filled polygons. Both are colour-coded by `safetyRating` using the safety palette. Leaflet popups show name, category/meta, description. Draw tools allow: circle-marker (pink `#e84393`) and polygon (pink, no self-intersect).

---

### 2. Login (`/login`)

Centred auth card. Fields: **Email**, **Password**. Inline error message on 401. Submit button: "Log in" / "Logging in…". Footer link to `/register`.

---

### 3. Register (`/register`)

Centred auth card. Fields: **Display name**, **Email**, **Password** (min 8 chars, hint shown), **Pronouns** (optional `<select>`: "they/them", "she/her", "he/him", "ze/zir", "prefer not to say", "custom"). Inline error on 409 (email taken). Submit button: "Sign up" / "Creating account…". Footer link to `/login`.

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

### 6. Admin Panel (`/admin`) — admin-guarded

Page with `h1` "Admin panel" and subtitle. Allows admins and super admins to manage user roles.

#### Page Header

- `h1` "Admin panel"
- Subtitle: "Manage user roles. Only admins and super admins can access this page."
- **Stats bar** — inline summary showing total user counts per role:
  `{n} users · {n} reviewers · {n} admins · {n} super admins`
  Styled as muted text (`#6b6f80`), positioned below the subtitle.

#### Search & Filter Bar

- **Search input** — `placeholder="Search by name or email"`, filters the user list client-side in real time.
  `aria-label="Search users"`. Full-width on mobile, max `360px` on desktop.
- **Role filter** — `<select>` dropdown: "All roles", "User", "Reviewer", "Admin", "Super Admin".
  Positioned inline with the search input on desktop (flex row), stacked on mobile.

#### User List

A responsive grid/list of user cards (`<ul class="user-list">`). Each card (`<li class="card">`) contains:

- **Card head row** — left: `h2` display name + optional `(you)` label if this is the currently authenticated user; right: `role-badge` (colour-coded, see Role Badges below).
- **Email line** — `<p class="meta">` showing `user.email`. If `emailVerified === false`, append a warning chip: `⚠ Unverified` styled in `#ef6c00` amber.
- **Actions row** — role `<select>` + save state indicator.
  - `aria-label="Change role for {displayName}"`
  - Option labels use human-readable text (not raw enum values):
    | Value | Label |
    | ------------- | ------------ |
    | `user` | User |
    | `reviewer` | Reviewer |
    | `admin` | Admin |
    | `super_admin` | Super Admin |
  - The `<select>` is **disabled** while `user.busy` is true or when the card represents the currently logged-in user (prevents self-demotion).
  - When `user.busy` is true: show an inline `<span class="spinner">Saving…</span>` next to the select.
  - On successful save: replace the spinner briefly with a `<span class="save-ok">Saved ✓</span>` (green `#2e933c`, auto-hides after 2 s).
  - On error: show `<p class="error">` beneath the actions row with message "Could not update role. Please try again."

#### Role Badges

Colour-coded pill badges on each card. Values aligned with design tokens:

| Role          | Badge label | Background | Text colour |
| ------------- | ----------- | ---------- | ----------- |
| `user`        | USER        | `#e0e0e0`  | `#333333`   |
| `reviewer`    | REVIEWER    | `#bbdefb`  | `#1565c0`   |
| `admin`       | ADMIN       | `#ffe0b2`  | `#ef6c00`   |
| `super_admin` | SUPER ADMIN | `#ffcdd2`  | `#c62828`   |

Badges are `font-size: 0.75rem`, `font-weight: 600`, `text-transform: uppercase`, `border-radius: 4px`, `padding: 4px 8px`.

#### Guard Behaviour & Self-Protection Rules

- The route is guarded by `adminGuard` (requires `role === 'admin' || role === 'super_admin'`).
- **Self-demotion prevention**: The role `<select>` for the card matching the currently logged-in user's ID is always `disabled`. A tooltip `title="You cannot change your own role"` is applied to the wrapper.
- **Super admin protection**: Admins (non-super) cannot promote to or demote from `super_admin`. The `super_admin` option is hidden from the `<select>` for users with `role === 'admin'` (non-super admins).

#### Empty & Loading States

| State           | UI                                                               |
| --------------- | ---------------------------------------------------------------- |
| Loading         | `<p class="muted">Loading…</p>` replaces the list                |
| Load error      | `<p class="error">` with message and a "Retry" text button       |
| No users        | `<p class="muted">No users found.</p>`                           |
| No filter match | `<p class="muted">No users match your search.</p>` (client-side) |

#### Topbar — Admin Nav Link

The "Admin" link is visible in the top navigation only for users with `role === 'admin'` or `role === 'super_admin'`. It follows the same active-underline style (`#e84393`, 2px) as other nav links.

---

## Component Hierarchy

```
App (shell + topbar)
├── MapComponent              /
├── LoginComponent            /login
├── RegisterComponent         /register
├── MySubmissionsComponent    /mine    [authGuard]
├── ReviewComponent           /review  [reviewerGuard]
└── AdminComponent            /admin   [adminGuard]
```

---

## User Roles & Conditional UI

| UI element                     | Guest | User | Reviewer | Admin | Super Admin |
| ------------------------------ | ----- | ---- | -------- | ----- | ----------- |
| Browse map (approved markings) | ✅    | ✅   | ✅       | ✅    | ✅          |
| Draw / submit marking          | ❌    | ✅   | ✅       | ✅    | ✅          |
| "My submissions" nav link      | ❌    | ✅   | ✅       | ✅    | ✅          |
| "Review queue" nav link        | ❌    | ❌   | ✅       | ✅    | ✅          |
| `reviewer` badge in topbar     | ❌    | ❌   | ✅       | ❌    | ❌          |
| "Admin" nav link               | ❌    | ❌   | ❌       | ✅    | ✅          |
| `admin` badge in topbar        | ❌    | ❌   | ❌       | ✅    | ❌          |
| `super_admin` badge in topbar  | ❌    | ❌   | ❌       | ❌    | ✅          |
| Promote users to `super_admin` | ❌    | ❌   | ❌       | ❌    | ✅          |

---

## Topbar

Height `56px`, background `#1d1f2b`, horizontal flex layout.

- **Brand** — rainbow flag emoji + "Colours of Safety", bold white, links to `/`
- **Community symbols** — Support Progress Pride, Transgender, Intersex, Asexual flags in relevant contexts (youth centers, trans services, etc.)
- **Nav** — "Map" always; "My submissions" when logged in; "Review queue" when reviewer. Active link underlined with `#e84393` (2px bottom border)
- **Account area** (right-aligned):
  - _Logged out_: "Log in" link + "Sign up" CTA button (`#e84393` bg)
  - _Logged in_: display name (bold) · optional `reviewer` pill badge (`#e84393`) · "Log out" text button

---

## Accessibility Requirements (WCAG 2.1 AA)

### ARIA & Screen Reader Support

| Element             | Requirement                                                      |
| ------------------- | ---------------------------------------------------------------- |
| Map container       | `role="application"` + `aria-label="Interactive safety map"`     |
| Search input        | `aria-label="Search city or address"` (placeholder insufficient) |
| Icon-only buttons   | `aria-label` required (search, locate, edit, delete, close)      |
| Toast notifications | `role="status" aria-live="polite" aria-atomic="true"`            |
| Navigation          | `<nav aria-label="Main navigation">`                             |
| Dialogs/modals      | `role="dialog" aria-modal="true" aria-labelledby="<title-id>"`   |
| Error messages      | `role="alert"` + `aria-describedby` linking to input             |
| Decorative elements | `aria-hidden="true"` (rainbow emoji, color swatches)             |
| Range slider        | `[attr.aria-valuetext]` bound to human-readable label            |

### Keyboard & Focus Management

- **Skip link**: First focusable element, visually hidden until focused, targets `#main-content`
- **Focus trap**: Modal dialogs must trap focus while open, restore focus to trigger on close
- **Focus indicators**: `outline: 2px solid #e84393; outline-offset: 2px;` alongside `box-shadow` for forced-colors mode
- **All interactive elements**: Must be reachable via keyboard (no `display:none` for mobile nav—use accessible disclosure pattern)

### High Contrast Mode

```scss
@media (forced-colors: active) {
  .safety-rating-swatch {
    border: 1px solid CanvasText;
  }
  .map-marker {
    forced-color-adjust: none;
  }
}
```

### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  .toast,
  .panel-slide,
  .modal {
    animation: none;
    transition: none;
  }
}
```

---

## Forms — Shared Patterns

- Reactive Forms (Angular `FormBuilder.nonNullable`)
- Labels wrap inputs (`flex-direction: column`, `gap: 0.3rem`)
- Focus ring: `border-color: #e84393`, `box-shadow: 0 0 0 3px rgba(232,67,147,.15)`
- Error messages: `<p class="error">` in accent red (`#d7263d`)
- Submit buttons disabled + show "…" label while `submitting` signal is true
- Auth card: centred, white, rounded, shadow (shared `auth.scss`)

---

## Future Considerations

### Multi-Dimensional Safety Ratings (Phase 2)

Replace single 1-5 scale with dimensional ratings:

```typescript
interface SafetyDimensions {
  physicalSafety: number; // Violence/harassment risk
  emotionalSafety: number; // Affirming, respectful staff
  bathroomAccess: number; // Gender-neutral options
  racialSafety: number; // BIPOC-welcoming
  disabilityAccess: number; // Mobility/sensory accommodations
}
```

UI: 5 sliders or star ratings per dimension, overall score computed as average.

### i18n & Localization (Phase 3)

- Language selector in topbar or footer
- Priority languages: Spanish, Portuguese, French, Arabic
- Dynamic `lang` attribute updates on `<html>`

### Privacy & Safety Features

- **Geolocation warning**: Prominent notice before requesting location permission
- **Stealth mode education**: "Private browsing" notice about browser history
- **Email verification**: Required before submissions accepted
- **2FA support**: TOTP/WebAuthn for high-risk regions
