# Product Requirements Document — Colours of Safety

**Product:** Colours of Safety  
**URL:** coloursofsafety.com  
**Purpose:** Community map for LGBTQIA+ safe places and districts  
**Last updated:** 2026-06-01

---

## 1. Users & Goals

| Persona | Goal |
|---|---|
| **Guest** | Browse the map to find safe places/districts without an account |
| **Contributor** | Submit new safe places or districts and track their status |
| **Reviewer** | Moderate community submissions before they go public |
| **Admin** | Manage user accounts and roles |

---

## 2. User Stories by Priority

### P0 — Must Have (Core Value)

**AS A guest, I want to:**

- Browse the interactive map and see all approved safe places and districts, so I can plan my movements safely
- Distinguish safety levels at a glance via colour-coding (red → green scale), so I don't need to open every marker
- Click a marker/area to see its name, category, description, and safety rating, so I get actionable detail
- Use the app on any device (mobile, tablet, desktop), so I'm not limited to a specific platform

**AS A contributor, I want to:**

- Create an account with email + password, so I can contribute to the community
- Log in and out securely, so my account remains protected
- Drop a point on the map to mark a specific place (bar, café, health clinic, etc.), so others know safe venues
- Draw a polygon to mark an entire district or neighbourhood, so I can describe area-level safety
- Provide a name, category, safety rating (1–5), and optional notes per submission, so reviewers have full context
- See my pending/approved/rejected submissions and any reviewer feedback, so I can track my contributions
- Understand my submission is not public until approved, so I set correct expectations

**AS A reviewer, I want to:**

- See all pending submissions in a queue, so I can process them efficiently
- Approve or reject a submission with an optional note, so contributors receive meaningful feedback
- See submission details (name, location, category, rating, description, author), so I can make an informed decision

---

### P1 — Should Have (Quality & Trust)

**AS A guest, I want to:**

- See a legend explaining the colour scale, so I immediately understand the map without instructions
- See a hint about how to contribute when I'm not logged in, so I'm nudged to sign up

**AS A contributor, I want to:**

- Edit or delete my own pending submissions before a review decision, so I can fix mistakes
- Receive a confirmation (toast/notification) after submitting, so I know the action succeeded
- Filter the map by category (bar, healthcare, etc.) or minimum safety rating, so I find relevant places faster

**AS A reviewer, I want to:**

- Filter the queue by type (place vs district) or category, so I can batch-process related items

**AS AN admin, I want to:**

- View all registered users and their roles, so I have visibility over the community
- Promote a user to reviewer or admin, so the moderation team can scale
- Demote or suspend a problematic account, so community safety is protected

---

### P2 — Nice to Have (Growth & Engagement)

**AS A guest, I want to:**

- Search for a city, address, or place name, so I can navigate the map without knowing coordinates
- Share a direct link to a specific place or district, so I can recommend it to others

**AS A contributor, I want to:**

- Receive an email notification when my submission is reviewed, so I'm not waiting blindly
- Add photos to a submission, so the community has richer context
- "Star" or bookmark places on the map, so I can revisit them later

**AS A reviewer, I want to:**

- See a heat-map or summary of submission activity by area, so I can prioritise high-activity zones

**AS ANY user, I want to:**

- Use the app in multiple languages (internationalisation), so non-English communities can benefit
- Log in via social auth (Google, etc.) as an alternative to email/password, so onboarding is frictionless

---

### P3 — Exploratory (Future Consideration)

- Community voting / upvotes on submitted markings
- Mobile app (PWA or native) with GPS-based "near me" view
- Public API for third-party integrations
- Gamification: contribution badges / leaderboard
- Verified organisation badges (e.g. NGOs, health centres)

---

## 3. Acceptance Criteria — P0 Stories

| Story | Acceptance Criteria |
|---|---|
| Browse map (guest) | Approved POIs and districts load within 3 s on a standard connection; colour-coded by safety rating |
| Register | Email uniqueness enforced; password min 8 chars; inline error on duplicate email |
| Submit POI | Name required (min 2 chars); category required; rating 1–5; submission created with `pending` status; not visible on public map |
| Submit district | Polygon drawn on map; same form fields as POI minus category |
| Review approval | Reviewer can approve/reject from queue; optional note saved; approved marking appears on map; contributor sees updated status in "My submissions" |
| My submissions | Lists all own POIs and districts with status badge and reviewer note if present; newest-first |
| Admin user management | Admin can list users and change roles via `/admin` route |

---

## 4. Out of Scope (v1)

- Email notifications
- Photo uploads
- Social login
- Offline / PWA support
- Multi-language support
- Public API

---

## 5. Open Questions

1. **Self-registration to reviewer role** — should users be able to request reviewer status, or is it admin-only promotion?
2. **Deletion policy** — can contributors delete approved markings, or only pending ones? Does a reviewer need to soft-delete?
3. **Spam / abuse** — what rate-limiting or reporting mechanism is needed before launch?
4. **Geographic scope** — is the default map centre (Brussels) permanent, or should it auto-locate?
5. **Data ownership** — are submissions licensed for reuse (e.g. ODbL for OSM compatibility)?
