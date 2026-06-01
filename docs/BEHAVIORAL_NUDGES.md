# Behavioural Nudge Engine — Engagement Analysis

## Executive Summary

**Colours of Safety** is a community-driven LGBTQIA+ safe-space map. Its engagement loop is:
**Browse → Register → Contribute → Return**. This document identifies friction points, drop-off risks, and concrete nudge strategies grounded in behavioural psychology to increase contribution rate, return visits, and community growth.

---

## 1. Current Engagement Funnel

```
┌──────────────────────────────────────────────────────────┐
│  AWARENESS   →  passive visitor sees map                 │
│  ACTIVATION  →  registers account                        │
│  CONTRIBUTION →  submits a POI or district               │
│  RETENTION   →  returns to add more / check status       │
│  ADVOCACY    →  tells others / becomes reviewer          │
└──────────────────────────────────────────────────────────┘
```

### Current Drop-off Points

| Stage | Friction | Severity |
|---|---|---|
| Awareness → Activation | No value preview before login prompt; hint pill says "log in" but doesn't show *why* | High |
| Activation → Contribution | After registration, user lands on map with no guided action; draw tools are unfamiliar | High |
| Contribution → Retention | No feedback loop after submission (status via `/mine` only, no notification) | Medium |
| Retention → Advocacy | No social proof, no contributor identity, no progression | Medium |

---

## 2. Nudge Strategies

### 2.1 — Reduce Activation Friction (Guest → User)

| Nudge | Mechanism | Implementation |
|---|---|---|
| **Social proof counter** | Anchoring + bandwagon effect | Show "X safe spaces mapped by Y contributors" on the map legend or hero area |
| **Preview contribution value** | Loss aversion / curiosity gap | Let guests tap a marker → popup shows "Submitted by [Name]" with a "You can add places too" CTA |
| **Soft gate** | Zeigarnik effect | Let guest *start* drawing (first click) then gate at submit: "Save your work — sign up in 10 seconds" |
| **Progress pill** | Goal gradient | After registration, show "🎉 Step 1 done — add your first safe space!" pill on the map |

### 2.2 — Accelerate First Contribution (User → Contributor)

| Nudge | Mechanism | Implementation |
|---|---|---|
| **Onboarding tooltip tour** | Guided mastery | First login: highlight draw tools with 3-step tooltip ("① Click marker tool ② Tap a location ③ Fill details") |
| **Pre-filled suggestions** | Default effect | If user's browser location is available, centre map there + suggest "Know a safe space near you?" |
| **Low-effort entry** | Friction reduction | Add "Quick add" mode: tap map → name + rating only (description optional, already is, but category defaults without prompting) |
| **Immediate positive reinforcement** | Operant conditioning | After submit: celebratory micro-animation + toast "Your contribution helps the community!" (current toast is plain) |

### 2.3 — Drive Return Visits (Contributor → Retained)

| Nudge | Mechanism | Implementation |
|---|---|---|
| **Status notification** | Variable reward schedule | Email or push when submission is approved/rejected (opt-in) — closes the feedback loop |
| **Streak / contribution count** | Endowed progress | Show "You've added N safe spaces" badge on the topbar or `/mine` page |
| **Map activity feed** | Social comparison | Show "Recently approved" ticker/card on map so users see the community is alive |
| **"Your impact" summary** | Self-efficacy | On `/mine`: "Your 3 approved places have been viewed X times" (requires analytics) |

### 2.4 — Cultivate Advocacy (Retained → Ambassador)

| Nudge | Mechanism | Implementation |
|---|---|---|
| **Contributor tiers** | Status / identity | Bronze (1+), Silver (5+), Gold (15+) badges next to display name |
| **Invite mechanism** | Network effect | "Invite a friend" link with referral tracking; both get a badge |
| **Reviewer nomination** | Autonomy + purpose | After 10 approved submissions, prompt: "You know your community — want to help review?" |
| **Share a place** | Social currency | "Share this safe space" button on marker popup → generates OG-rich link for social media |

---

## 3. Priority Implementation Roadmap

### Phase 1 — Quick Wins (< 1 week, frontend-only)

1. **Social proof counter** on legend card — fetch approved POI/district count from existing `GET /api/pois` + `GET /api/districts`
2. **Enhanced toast** — upgrade submission toast with micro-animation + community message
3. **Post-registration pill** — show guided "add your first place" prompt for new users (detect 0 submissions)
4. **Contribution count** on `/mine` header — "You've contributed N safe spaces"

### Phase 2 — Medium Effort (1–2 weeks)

5. **Onboarding tooltip tour** — lightweight tooltip overlay (no library, 3 steps)
6. **"Recently approved" activity indicator** on map — last 3 approvals as a collapsible card
7. **Share button** on marker popup — copy link / open share dialog with OG metadata
8. **Soft gate drawing** — let guests start a shape, require auth at submit

### Phase 3 — Full System (2–4 weeks, needs backend)

9. **Notification system** — email on approval/rejection (new `NotificationsModule`, opt-in)
10. **Contributor tiers** — store contribution count, return in auth payload, display badges
11. **Reviewer nomination flow** — automatic prompt + admin approval
12. **View count / impact metrics** — analytics events + display on `/mine`

---

## 4. Metrics to Track

| Metric | Measures | Target |
|---|---|---|
| Registration conversion | Visitors → signed-up users | +30% |
| First-contribution rate | Registered → ≥1 submission within 7d | +50% |
| 30-day retention | Active contributors returning within 30 days | +40% |
| Submissions per user (avg) | Depth of engagement | 1.5 → 3.0 |
| Reviewer pipeline fill | Users self-nominating or being promoted | Sustainable queue |

---

## 5. Behavioural Principles Reference

| Principle | Application in CoS |
|---|---|
| **Social proof** | Counters, activity feed, contributor badges |
| **Goal gradient** | Progress pills, streak counts, tier progression |
| **Zeigarnik effect** | Soft-gating mid-action (started drawing → must sign up to save) |
| **Variable reward** | Approval notifications arrive unpredictably → builds checking habit |
| **Endowed progress** | "You're 1/3 of the way to Silver!" framing |
| **Default effect** | Pre-fill category, centre on user location, minimal required fields |
| **Loss aversion** | "Don't lose your contribution — sign up now" |
| **Self-efficacy** | Impact metrics ("Your places helped 42 people") |
| **Autonomy** | Reviewer nomination empowers trusted contributors |

---

## 6. Anti-Patterns to Avoid

- **Dark patterns** — Never guilt-trip or create false urgency. This is a safety tool for a vulnerable community.
- **Over-gamification** — Badges should feel warm, not competitive. No leaderboards that pit contributors against each other.
- **Notification spam** — All communications opt-in only. Respect user attention.
- **Gating core value** — The map must remain fully browsable without an account. Never hide safety information.

---

## 7. Technical Notes

- Social proof counter: derive from `.length` of existing API responses (already cached by Angular HttpClient if we add a shareReplay)
- Tooltip tour: can be a single-use `localStorage` flag (`cos.onboarded`) + a tiny Angular overlay component
- Soft gate: existing `draw:created` handler in `MapComponent` can check `isLoggedIn()` and open a modal instead of draft panel
- Contribution count: `MySubmissionsComponent` already fetches all user submissions — expose `.length` in header
- Tiers: add `contributionCount` field to `AuthUser` (backend computes at login from `COUNT(*) WHERE createdById AND status = 'approved'`)
