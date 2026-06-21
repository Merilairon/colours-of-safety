# Product Requirements Document — Colours of Safety

**Product:** Colours of Safety  
**URL:** coloursofsafety.com  
**Purpose:** Community map for LGBTQIA+ safe places and districts  
**Last updated:** 2026-06-21 (rev 4)

---

## 1. Users & Goals

| Persona         | Goal                                                            |
| --------------- | --------------------------------------------------------------- |
| **Guest**       | Browse the map to find safe places/districts without an account |
| **Contributor** | Submit new safe places or districts and track their status      |
| **Reviewer**    | Moderate community submissions before they go public            |
| **Admin**       | Manage user accounts and roles                                  |

---

## 2. User Stories by Priority

### P0 — Must Have (Core Value)

**AS A guest, I want to:**

- Browse the interactive map and see all approved safe places and districts, so I can plan my movements safely
- Distinguish safety levels at a glance via colour-coding (red → green scale), so I don't need to open every marker
- Click a marker/area to see its name, category, description, and safety rating, so I get actionable detail
- Use the app on any device (mobile, tablet, desktop), so I'm not limited to a specific platform
- See nearby POIs grouped together when zoomed out and separated when zoomed in, so the map remains readable at any scale

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
- See my pending submissions rendered on the map in a translucent style, so I know where they are while awaiting review
- Propose an edit to any existing POI or district, so outdated or incorrect information can be corrected
- See the status of my proposed edits and any reviewer feedback, so I can track whether they were accepted

**AS A reviewer, I want to:**

- Filter the queue by type (place vs district) or category, so I can batch-process related items
- Review proposed edits to existing POIs or districts, so I can approve or reject changes before they are published

**AS AN admin, I want to:**

- View all registered users and their roles, so I have visibility over the community
- Promote a user to reviewer or admin, so the moderation team can scale
- Demote or suspend a problematic account, so community safety is protected
- Ban or unban accounts, so persistent bad actors cannot access the platform
- Hide all submissions from a banned account, so harmful content is removed from public view

**AS AN authenticated user, I want to:**

- View and edit my profile (display name, avatar, bio), so my account reflects who I am
- Change my password, so I can keep my account secure
- Update my email address, so I can receive communications at the right inbox
- Choose whether to receive email notifications, so I control my inbox
- Delete my account, so I can remove my data from the platform

---

### P2 — Nice to Have (Growth & Engagement)

**AS A guest, I want to:**

- Search for a city, address, or place name, so I can navigate the map without knowing coordinates
- Share a direct link to a specific place or district, so I can recommend it to others
- See pending community submissions on the map in a translucent style, so I understand what's in the pipeline and can vote on them

**AS A contributor, I want to:**

- Receive an email notification when my submission is reviewed, so I'm not waiting blindly
- Add photos to a submission, so the community has richer context
- "Star" or bookmark places on the map, so I can revisit them later
- Upvote or downvote a pending submission, so the community can signal its value before a reviewer acts
- See the current vote tally on a pending marker/area popup, so I can gauge community sentiment

**AS A reviewer, I want to:**

- See a heat-map or summary of submission activity by area, so I can prioritise high-activity zones
- Have highly-upvoted submissions surfaced at the top of my queue, so I can prioritise what the community endorses
- Trust that a submission auto-approved by vote threshold has already passed basic community vetting, so I can focus my time on contested items

**AS ANY user, I want to:**

- Use the app in multiple languages (internationalisation), so non-English communities can benefit
- Log in via social auth (Google, etc.) as an alternative to email/password, so onboarding is frictionless

---

### P3 — Exploratory (Future Consideration)

- ~~Community voting~~ → promoted to P2 (see above)
- Mobile app (PWA or native) with GPS-based "near me" view
- Public API for third-party integrations
- Gamification: contribution badges / leaderboard
- Verified organisation badges (e.g. NGOs, health centres)

---

## 3. Acceptance Criteria — P0 Stories

| Story                        | Acceptance Criteria                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browse map (guest)           | Approved POIs and districts load within 3 s on a standard connection; colour-coded by safety rating; POIs cluster when zoomed out with count badges                                                                                                                                                                 |
| Register                     | Email uniqueness enforced; password min 8 chars; inline error on duplicate email                                                                                                                                                                                                                                    |
| Submit POI                   | Name required (min 2 chars); category required; rating 1–5; submission created with `pending` status; not visible on public map                                                                                                                                                                                     |
| Submit district              | Polygon drawn on map; same form fields as POI minus category                                                                                                                                                                                                                                                        |
| Review approval              | Reviewer can approve/reject from queue; optional note saved; approved marking appears on map; contributor sees updated status in "My submissions"                                                                                                                                                                   |
| My submissions               | Lists all own POIs and districts with status badge and reviewer note if present; newest-first                                                                                                                                                                                                                       |
| Admin user management        | Admin can list users and change roles via `/admin` route                                                                                                                                                                                                                                                            |
| Admin ban & content sweep    | Admin can ban/unban accounts from `/admin`; banned users cannot log in or perform actions; all POIs and districts owned by a banned user are hidden from the public map and marked with `banned` status; unbanning restores visibility unless individually moderated afterwards                                     |
| Pending on map (contributor) | Own `pending` POIs render on map at 40% opacity; own `pending` districts render with hatched/translucent fill; popup labels them "Pending — awaiting review"; not visible to other logged-out users or other contributors                                                                                           |
| Pending on map (public)      | All `pending` submissions visible to logged-in users at 40% opacity; guests see none; popup shows vote tally + upvote/downvote buttons (logged-in only)                                                                                                                                                             |
| Community voting             | Each logged-in user casts ≤1 vote (up or down) per submission; vote count stored on entity; reaching configurable threshold (default: **10 net upvotes**) triggers auto-approval and sets `status = approved`; submission then renders at full opacity; reviewer queue shows vote score per item                    |
| POI clustering               | POIs cluster within 50px radius when zoomed out; cluster size (small/medium/large) reflects child count; clicking cluster zooms to bounds; at max zoom clusters spiderfy to show individual markers; cluster icons use brand colour gradient (pink → dark pink)                                                     |
| Propose POI edit             | Logged-in user can open any POI/district and submit an edit proposal; changes include name, category, rating, description, and/or location; original entity remains unchanged; proposal is created with `pending` status and linked to the target entity                                                            |
| Propose district edit        | Same as POI edit proposal; polygon geometry can also be modified; proposal is queued for review without affecting the currently approved district                                                                                                                                                                   |
| Review edit proposal         | Reviewer sees edit proposals in queue with diff (old vs new values) and original author; can approve or reject with an optional note; on approval, the target entity is updated and the proposal status becomes `approved`; on rejection, the target entity is unchanged and the proposal status becomes `rejected` |
| My edits                     | Contributor can list all own edit proposals with target name, status badge, and reviewer note; newest-first; linked to the current version of the target entity                                                                                                                                                     |
| Profile & settings           | Authenticated user can view and update display name, avatar, and bio; change password with current-password confirmation; update email address with verification; toggle email notifications; delete account after confirmation; all changes persist across sessions and reflect in the UI immediately              |

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
6. **Pending visibility scope** — should all pending submissions be visible to all logged-in users, or only to the submitter? (affects vote gaming risk)
7. **Auto-accept threshold** — what is the configurable net-upvote threshold for auto-approval? Who can change it (admin only)? Does a downvote cancel an upvote 1-for-1?
8. **Vote manipulation** — how to prevent sock-puppet voting? (account age minimum, verified email requirement, 1 vote per IP per submission?)
9. **Auto-accept reviewability** — should auto-approved submissions still appear in the reviewer queue for post-hoc audit, or are they silently approved?
