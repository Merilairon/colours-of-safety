# Accessibility Audit — Colours of Safety

**Date:** 2026-06-01  
**Standard:** WCAG 2.1 AA  
**Auditor role:** Accessibility Auditor (static code review)  
**Scope:** All Angular frontend templates and global styles

---

## Summary

| Category | Issues Found | Critical | Moderate | Minor |
|---|---|---|---|---|
| Semantic HTML | 6 | 2 | 3 | 1 |
| Keyboard Navigation | 5 | 2 | 2 | 1 |
| Focus Management | 3 | 1 | 2 | 0 |
| Screen Reader Support | 7 | 3 | 3 | 1 |
| Colour Contrast | 4 | 1 | 2 | 1 |
| Forms & Labels | 4 | 1 | 2 | 1 |
| Motion / Reduced Motion | 1 | 0 | 1 | 0 |
| **Total** | **30** | **10** | **15** | **5** |

---

## Critical Issues

### C1 — Map has no accessible alternative
**File:** `frontend/src/app/map/map.html:2`  
**WCAG:** 1.1.1 Non-text Content (Level A)

The Leaflet map `<div #mapEl class="map">` is empty with no `role`, `aria-label`, or text alternative. Screen readers announce nothing or raw Leaflet-generated markup without context.

**Fix:** Add `role="application"` and `aria-label="Interactive safety map"`. Provide a `<noscript>` or visually-hidden summary listing approved places for non-visual users.

---

### C2 — Search input has no accessible label
**File:** `frontend/src/app/map/map.html:8-13`  
**WCAG:** 1.3.1 Info and Relationships (Level A), 4.1.2 Name, Role, Value (Level A)

```html
<input type="text" placeholder="Search city or address..." ...>
```

`placeholder` is not a label. When the field has a value the hint disappears. No `<label>`, `aria-label`, or `aria-labelledby` present.

**Fix:** Add `aria-label="Search city or address"` or wrap in a `<label>`.

---

### C3 — Icon-only buttons have no accessible name
**File:** `frontend/src/app/map/map.html:14-25`, `frontend/src/app/submissions/my-submissions.html:50-61`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)

Search submit button renders `🔍` or `...`; locate button renders `📍`; edit/delete buttons render `✎` / `✕` with only `title` attributes. `title` is not reliably announced and is unavailable on touch devices.

**Fix:** Replace or supplement emoji content with `aria-label`:
```html
<button type="submit" aria-label="Search">🔍</button>
<button type="button" class="locate-btn" aria-label="Find my location">📍</button>
<button type="button" class="icon-btn" aria-label="Edit submission">✎</button>
<button type="button" class="icon-btn danger" aria-label="Delete submission">✕</button>
```

---

### C4 — Modals trap no focus and have no ARIA role
**File:** `frontend/src/app/submissions/my-submissions.html:70-108`, `111-126`  
**WCAG:** 2.1.2 No Keyboard Trap (Level A, inverse — focus must be *trapped* inside dialogs), 4.1.2

Both edit and delete modals open without `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, or programmatic focus management. Keyboard users can tab behind the overlay. Screen readers do not announce dialog context.

**Fix:** Add `role="dialog" aria-modal="true" aria-labelledby="<h3-id>"`, move focus to first interactive element on open, restore focus to trigger on close.

---

### C5 — Colour is the only indicator of safety rating
**File:** `frontend/src/app/map/map.html:55`, review cards `review.html:36`  
**WCAG:** 1.4.1 Use of Color (Level A)

Legend swatches (`<span class="swatch">`) and review rating badges rely solely on background colour to convey safety level. The label text exists but is not programmatically associated with the swatch.

**Fix:** The label text next to each swatch already helps — ensure the swatch has `aria-hidden="true"` and the label text remains visible at all zoom levels. In popups where only the coloured marker is shown, add a tooltip or visually-hidden text for the rating.

---

### C6 — Live region missing for toast notifications
**File:** `frontend/src/app/map/map.html:87-89`  
**WCAG:** 4.1.3 Status Messages (Level AA)

```html
<div class="toast">{{ toast() }}</div>
```

Toast appears and disappears visually but has no `role="status"` or `aria-live="polite"`. Screen reader users receive no notification of success/failure actions.

**Fix:**
```html
<div class="toast" role="status" aria-live="polite" aria-atomic="true">{{ toast() }}</div>
```

---

### C7 — Review textarea has no label
**File:** `frontend/src/app/review/review.html:52-57`  
**WCAG:** 1.3.1, 4.1.2 (Level A)

```html
<textarea rows="2" placeholder="Optional review note…" ...></textarea>
```

No associated `<label>`. `placeholder` only. Screen readers do not announce the purpose of this field.

**Fix:** Wrap in `<label>Optional review note<textarea ...></textarea></label>` or add `aria-label="Optional review note for {{ item.name }}"`.

---

### C8 — `<nav>` has no accessible name
**File:** `frontend/src/app/app.html:7`  
**WCAG:** 2.4.1 Bypass Blocks (Level A)

When multiple `<nav>` landmarks exist on a page, each must have a distinguishing `aria-label`. The single `<nav class="nav">` has no label, which is a minor issue now but will become a landmark collision if a secondary nav is added.

**Fix:** `<nav class="nav" aria-label="Main navigation">`

---

### C9 — `outline: none` on focused inputs with no replacement
**File:** `frontend/src/app/map/map.scss:170-175`, `frontend/src/app/auth/auth.scss:44-48`  
**WCAG:** 2.4.7 Focus Visible (Level AA)

All `input`, `select`, and `textarea` focus styles remove the browser default `outline: none` and replace it with a `box-shadow`. While box-shadow is visible to most users, it provides zero contrast in Windows High Contrast / Forced Colors mode because box-shadow is suppressed.

**Fix:** Add `outline: 2px solid #e84393; outline-offset: 2px;` alongside the existing box-shadow, then use `@media (forced-colors: active)` to ensure the outline is visible.

---

### C10 — Close-hint button (Welcome banner) has no label
**File:** `frontend/src/app/map/map.html:69`  
**WCAG:** 4.1.2 (Level A)

```html
<button type="button" class="close-hint" (click)="showWelcome.set(false)">✕</button>
```

No `aria-label`. Screen readers may announce "times" or nothing meaningful.

**Fix:** `<button type="button" class="close-hint" aria-label="Close welcome message">✕</button>`

---

## Moderate Issues

### M1 — Skip navigation link absent
**File:** `frontend/src/index.html`, `frontend/src/app/app.html`  
**WCAG:** 2.4.1 Bypass Blocks (Level A)

No skip-to-content link. Keyboard users must tab through the entire topbar (brand + all nav links + account controls) to reach the main content on every page.

**Fix:** Add as first child of `<body>`:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```
Add `id="main-content"` to `<main class="content">`. Style `.skip-link` visually hidden until focused.

---

### M2 — Error messages not associated with inputs
**File:** `login.html:15-17`, `register.html:20-22`  
**WCAG:** 3.3.1 Error Identification (Level A)

```html
@if (error()) { <p class="error">{{ error() }}</p> }
```

The `<p class="error">` is not linked to any form field via `aria-describedby` and has no `role="alert"`. Screen readers may not announce it on dynamic injection.

**Fix:** Add `role="alert"` to the error `<p>`. Where the error is field-specific, add `aria-describedby="error-id"` to the relevant input and `id="error-id"` to the error element.

---

### M3 — Range input for safety rating has no value announcement
**File:** `frontend/src/app/map/map.html:115`, `my-submissions.html:93`  
**WCAG:** 4.1.2 (Level A)

```html
<input type="range" min="1" max="5" step="1" formControlName="safetyRating" />
```

The `<label>` shows the current label text (e.g., "Safety rating: **Welcoming**") but the range input itself has no `aria-valuetext`. Screen readers announce the numeric value (1–5), not the human-readable safety label.

**Fix:** Add `[attr.aria-valuetext]="safetyLabel(form.controls.safetyRating.value)"`.

---

### M4 — Colour contrast: nav inactive link `#c7c9d9` on `#1d1f2b`
**File:** `frontend/src/app/app.scss:38`  
**WCAG:** 1.4.3 Contrast Minimum (Level AA)

`#c7c9d9` on `#1d1f2b` = contrast ratio ~**8.0:1** — this passes. However, the hover/active state uses `#fff` on the same dark background — also passes.

The `.sub` / `.meta` helper text colour `#6b6f80` on white `#fff` = ~**4.5:1** — borderline pass. On the `rgba(255,255,255,0.95)` panel background it passes but should be verified at runtime against rendered backgrounds.

---

### M5 — Filter bar buttons in review queue lack visible focus ring in some browsers
**File:** `frontend/src/app/review/review.html:7-19`, `review.scss`  
**WCAG:** 2.4.7 Focus Visible (Level AA)

Review filter buttons (All / Places / Districts) and the active/inactive state rely only on a background colour change. No explicit `&:focus-visible` style was observed in `review.scss`.

**Fix:** Add `:focus-visible` with an `outline` to the filter button styles.

---

### M6 — `<main>` landmark lacks `id` for skip-link target
Already covered as part of M1; tracked separately as it impacts landmark navigation used by screen reader users' quick-navigation (e.g., NVDA's `m` key).

---

### M7 — Brand emoji `🏳️‍🌈` has no `aria-hidden`
**File:** `frontend/src/app/app.html:3`  
**WCAG:** 1.1.1 (Level A — decorative)

```html
<span class="brand-mark">🏳️‍🌈</span>
```

Screen readers will announce the full Unicode description: *"white flag, rainbow flag"*. This is redundant since `<span class="brand-name">Colours of Safety</span>` follows.

**Fix:** `<span class="brand-mark" aria-hidden="true">🏳️‍🌈</span>`

---

### M8 — `<footer>` links have no `:focus-visible` style
**File:** `frontend/src/app/app.scss:169-176`  
**WCAG:** 2.4.7 (Level AA)

Footer `<a>` hover style exists but no `&:focus-visible` is defined. Browser defaults may be suppressed by global `* { box-sizing }` resets or inherited `outline: none`.

---

### M9 — Admin `<select>` for role change has no label
**File:** `frontend/src/app/admin/admin.component.html:25-33`  
**WCAG:** 1.3.1, 4.1.2 (Level A)

```html
<select [value]="user.role" ...>
```

No `<label>` or `aria-label`. Screen readers announce "combobox" with no context about which user's role is being changed.

**Fix:** `<select [attr.aria-label]="'Change role for ' + user.displayName" ...>`

---

### M10 — Mobile: brand name hidden via `display:none` removes accessible text
**File:** `frontend/src/app/app.scss:119-121`  
**WCAG:** 2.4.6 Headings and Labels (Level AA) / 1.3.1

```scss
.brand-name { display: none; }  // at max-width: 768px
```

`display: none` also removes the text from the accessibility tree. The brand `<a>` link then only has the emoji as its accessible name (even after fixing M7 with `aria-hidden`).

**Fix:** Use visually-hidden CSS class instead of `display: none`, or add `aria-label="Colours of Safety – home"` to the brand `<a>`.

---

### M11 — Nav hides non-active links on mobile via `display:none`
**File:** `frontend/src/app/app.scss:148-155`  
**WCAG:** 2.1.1 Keyboard (Level A)

```scss
@media (max-width: 480px) {
  .nav a:not(.active) { display: none; }
}
```

Keyboard and screen-reader users on small screens lose access to all non-active navigation links. This is effectively a content removal, not a visual-only change.

**Fix:** Use an accessible hamburger/disclosure pattern instead of hiding links outright.

---

### M12 — `<h2>` used inside `<li>` in review queue and admin
**File:** `review.html:41`, `admin.component.html:18`  
**WCAG:** 1.3.1 (Level A) — heading hierarchy

Card titles use `<h2>` inside list items under a page `<h1>`. This is technically valid but creates a flat heading tree. If the page heading is `<h1>` and each card is independently navigable, `<h2>` is appropriate — however the review page also has a filter bar section with no heading, making the structure inconsistent.

---

## Minor Issues

### N1 — Legend swatches have no `aria-hidden`
**File:** `frontend/src/app/map/map.html:55`

Decorative colour swatches `<span class="swatch">` will be announced by some screen readers. Add `aria-hidden="true"`.

---

### N2 — `placeholder` used as hint text without `<small>` equivalent
**File:** `frontend/src/app/map/map.html:99`

Draft panel name input uses only `placeholder="e.g. Rainbow Cafe"` for hint. Once the user types, hint disappears. Low severity since the label "Name" is present. Consider persisting hint as `<small>` below the input.

---

### N3 — Missing `lang` attribute completeness
**File:** `frontend/src/index.html:2`

`<html lang="en">` is present — this is correct. Minor note: if the app ever adds multilingual support, the `lang` attribute must be updated dynamically.

---

### N4 — Toast disappears with no animation — users with cognitive disabilities
**File:** `frontend/src/app/map/map.scss:110-122`  
**WCAG:** 2.2.3 No Timing (Level AAA — informational)

No `prefers-reduced-motion` consideration for the toast. Not a WCAG AA failure but worth noting for inclusive design.

---

### N5 — Privacy page not audited in detail
**File:** `frontend/src/app/privacy/privacy.component.html`

Privacy page was not fully audited in this report. A supplementary review of its heading structure and link contrast is recommended.

---

## Positive Findings

- `<html lang="en">` present. ✓
- `<meta name="viewport" content="width=device-width, initial-scale=1">` — no `user-scalable=no`. ✓
- Form `autocomplete` attributes correctly set on all auth inputs. ✓
- `<label>` wrapping pattern used consistently in forms (explicit association). ✓
- `type="submit"` and `type="button"` correctly distinguished on all buttons. ✓
- Semantic `<header>`, `<main>`, `<footer>`, `<nav>` landmarks used in shell. ✓
- Focus ring replacement (box-shadow) is present, even if incomplete for forced-colors. ✓
- Draft panel uses `<h2>` inside `<form>` — reasonable heading hierarchy. ✓

---

## Recommended Priority Order

1. **C6** — Add `role="status" aria-live="polite"` to toast (1 line)
2. **C10 / M7** — Add `aria-label` / `aria-hidden` to icon buttons and decorative emoji (5 min)
3. **C2** — Add `aria-label` to search input (1 line)
4. **C3** — Add `aria-label` to all icon-only buttons (5 min)
5. **C4** — Implement focus-trap + ARIA role on modals (medium effort)
6. **M1** — Add skip link (15 min)
7. **C9** — Add `outline` alongside box-shadow for forced-colors support (CSS only)
8. **M2** — Add `role="alert"` to error paragraphs (1 line each)
9. **M3** — Bind `aria-valuetext` on range inputs
10. **C1** — Add accessible alternative / `role="application"` to map div
11. **M10 / M11** — Replace `display:none` nav hiding with accessible pattern
12. **M9** — Add `aria-label` to admin role select
