# LGBTQIA+ Inclusivity Assessment Report

**Project:** Colours of Safety (coloursofsafety.com)  
**Assessor:** Inclusive Visuals Specialist  
**Date:** June 2026  
**Status:** ⚠️ Partially Inclusive — Strong foundation with significant gaps

---

## Executive Summary

Colours of Safety is a community-driven map platform for marking LGBTQIA+ safe spaces. While the project has a solid technical foundation and clear community purpose, several critical inclusivity gaps remain that could exclude vulnerable community members.

**Overall Rating:** 6/10 — LGBTQ-targeted but not yet fully accessible.

---

## 1. Category Gaps

### Current Categories (8)
`bar`, `cafe`, `restaurant`, `club`, `community`, `healthcare`, `shop`, `other`

### Missing LGBTQIA+-Specific Categories

| Missing Category | Why It Matters | Priority |
|---|---|---|
| Bookstore | LGBTQ bookstores are historic community anchors | High |
| Youth Center | Critical for LGBTQ youth who face highest homelessness rates | High |
| Support Group | Peer support spaces not tied to formal healthcare | High |
| HIV/STI Testing | Specific health service distinct from general healthcare | Medium |
| Transgender Services | Gender-affirming care, voice therapy, legal aid | High |
| Crisis Shelter | Safe housing for LGBTQ individuals fleeing violence | High |
| Legal Aid | LGBTQ-specific legal services (name changes, asylum) | Medium |
| Religious/Spiritual | Affirming churches, synagogues, mosques | Medium |
| Sexual Health Clinic | PrEP providers, PEP access, queer-competent care | Medium |

**Files to Modify:**
- `@/frontend/src/app/core/safety.ts` — Expand `POI_CATEGORIES` array
- `@/backend/src/pois/poi.entity.ts` — Update category validation if enum-based

---

## 2. Accessibility Barriers

### Current State
No accessibility features implemented.

### Critical Gaps

| Gap | Impact | Fix |
|---|---|---|
| No wheelchair accessibility tag | Mobility-impaired users cannot filter | Add `wheelchairAccessible` boolean to POI/District |
| No high contrast mode | Colorblind users struggle with safety color scale | Implement CSS high-contrast theme |
| No screen reader optimizations | Blind/low-vision users excluded | Add ARIA labels to map markers |
| No cognitive accessibility | Neurodivergent users may be overwhelmed | Add "reduce animations" toggle |

### Critical Issue: Red-Green Color Scale
The safety rating color scale (`#d7263d` red → `#2e933c` green) is problematic for deuteranopia/protanopia (affects ~8% of males). **Must add patterns or icons alongside colors.**

**Files to Modify:**
- `@/frontend/src/app/core/safety.ts` — Add secondary visual indicators
- `@/frontend/src/app/map/map.scss` — High-contrast theme CSS
- `@/frontend/src/app/map/map.html` — ARIA labels

---

## 3. User Profile Inclusivity

### Current User Entity Fields
`email`, `displayName`, `passwordHash`, `role`

### Missing Identity Fields

| Field | Purpose | Privacy Consideration |
|---|---|---|
| Pronouns (optional) | Signal inclusive environment | Always optional, never displayed publicly without consent |
| Identity Tags (optional) | "Trans woman", "Non-binary", "Two-Spirit", etc. | Private to user only; used for internal metrics |
| Anonymity Mode | Browse without display name on contributions | Toggle per-submission |

### Privacy Concern
All contributions currently show `displayName` publicly. No option for anonymous contributions — dangerous for users in unsafe regions or those not out.

**Files to Modify:**
- `@/backend/src/users/user.entity.ts` — Add optional fields
- `@/frontend/src/app/auth/register.html` — Add pronouns field
- `@/frontend/src/app/map/map.ts` — Add anonymous submission toggle

---

## 4. Safety and Privacy Gaps

| Issue | Risk | Mitigation |
|---|---|---|
| Geolocation API requires permission | Location data can out users | Add prominent warning about privacy implications |
| No "stealth mode" | Browsing history visible | Add "private browsing" educational notice |
| Search queries logged to Nominatim | Search history leaks intent | Document data sharing with OSM/Nominatim in privacy policy |
| Email verification missing | Fake accounts can spam | Implement email verification before submissions |
| No 2FA | Account compromise risk | Add TOTP/WebAuthn support for high-risk regions |

---

## 5. Representation and Language

| Gap | Current | Needed |
|---|---|---|
| Default map center | Brussels, Belgium | Auto-detect or allow user preference |
| Language support | English only | i18n for Spanish, Portuguese, French, Arabic |
| Community symbols | Only rainbow flag | Add Progress Pride, Transgender, Intersex, Asexual flags |
| Terminology | "queer-friendly" used throughout | Some users find "queer" offensive; allow preference? |

---

## 6. Missing Safety Dimensions

### Current Model
Single 1-5 rating scale.

### Recommended Multi-Dimensional Model

```typescript
interface SafetyDimensions {
  physicalSafety: number;      // Violence/harassment risk
  emotionalSafety: number;     // Affirming, respectful staff
  bathroomAccess: number;      // Gender-neutral options
  racialSafety: number;        // BIPOC-welcoming
  disabilityAccess: number;    // Mobility/sensory accommodations
}
```

A "5" in one dimension does not guarantee a "5" in another. A gay bar can be welcoming to cis gay men but hostile to trans women.

---

## 7. Content Moderation Bias Risk

### Current Reviewer Model
Any admin-promoted user can approve/reject submissions.

### Unaddressed Risks
- Reviewers may have unconscious bias against trans-owned businesses
- "Mixed" (rating 3) submissions may reflect reviewer discomfort, not actual safety
- No reviewer training materials or bias guidelines exist
- No appeals process for rejected submissions

**Recommendation:** Add `reviewerGuidelines.md` requiring intersectional awareness training.

---

## 8. Regulatory and Legal Gaps

| Requirement | Status | Action |
|---|---|---|
| GDPR Article 9 (special categories) | ⚠️ Partial | Sexual orientation data inferred from usage — needs explicit consent |
| EU Cookie Consent | ❌ Missing | Add cookie banner |
| COPPA (US minors) | ❓ Unclear | No age verification; youth may use platform |
| Right to be forgotten | ⚠️ Partial | Account deletion not implemented |

---

## Implementation Priority

### Phase 1 — Critical (This Week)
1. Add wheelchair accessibility checkbox to submission form
2. Implement high-contrast CSS mode
3. Add 9 missing LGBTQIA+-specific categories
4. Add anonymity option for submissions

### Phase 2 — High Priority (Next 2 Weeks)
5. Multi-dimensional safety ratings
6. Pronouns field (optional) in user profile
7. Cookie consent banner
8. Accessibility audit (WCAG 2.1 AA)

### Phase 3 — Medium Priority (Next Month)
9. i18n framework + 4 priority languages
10. Email verification flow
11. Reviewer bias training documentation
12. Geolocation privacy warnings

---

## Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| Categories covering LGBTQ needs | 8/17 (47%) | 17/17 (100%) |
| Accessibility WCAG violations | Unknown | 0 critical, 0 serious |
| Anonymous submissions | 0% | >20% (safety indicator) |
| Non-English users | 0% | >30% |
| User-reported "felt unsafe" | N/A | <2% |

---

## Conclusion

Colours of Safety demonstrates genuine intent to serve the LGBTQIA+ community. However, several gaps create exclusion risks:

1. **Categories** exclude vital services (youth centers, shelters, trans services)
2. **Accessibility** is unaddressed — colorblind and mobility-impaired users excluded
3. **Privacy** lacks anonymity options — dangerous for non-out users
4. **Safety model** is one-dimensional, missing intersectional risks

**Recommendation:** Complete Phase 1 items before promoting as "fully inclusive."

---

## Related Documents

- `PRD.md` — Product requirements
- `TODO.md` — Implementation tracking
- `BEHAVIORAL_NUDGES.md` — Engagement strategies
- `ARCHITECTURE.md` — Technical architecture

---

*Report generated for Colours of Safety project maintainers.*
