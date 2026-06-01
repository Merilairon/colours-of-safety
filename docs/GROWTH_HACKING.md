# Growth Hacking Strategy — Colours of Safety

> **Goal:** Drive qualified traffic to coloursofsafety.com  
> **Target:** LGBTQIA+ individuals seeking safe spaces, allies, travelers  
> **Last updated:** 2026-06-01

---

## 1. Acquisition Channels (Ranked by Impact/Effort)

### 1.1 SEO — Organic Search (High Impact, Long-term)

**Status:** Baseline SEO docs exist. Execution pending.

| Action | Owner | Timeline | Status |
|--------|-------|----------|--------|
| Complete Phase 1 SEO (meta, robots, sitemap, OG image) | Dev | Week 1 | Pending |
| Implement Angular SSR for crawlability | Dev | Week 2 | Pending |
| Create location-specific landing pages | Content | Week 4 | Not started |
| Build backlinks from LGBTQ orgs | Outreach | Ongoing | Not started |

**Quick Wins:**
- Target long-tail: "trans friendly cafes [city]", "queer safe spaces [city]"
- Create city-specific pages: `/city/brussels`, `/city/amsterdam`
- Schema markup for local search

---

### 1.2 Community Partnerships (High Impact, Low Cost)

**Target Partners:**

| Type | Examples | Value Exchange |
|------|----------|----------------|
| LGBTQ Centers | Brussels Rainbow House, London LGBT Forum | Embed map, co-promote |
| Travel Sites | Purple Roofs, GayCities | Cross-link, data share |
| NGOs | ILGA, Stonewall | Endorsement, reach |
| Pride Orgs | Local Pride committees | Event integration |
| Queer Creators | LGBTQ YouTubers, TikTokers | Exclusive early access |

**Outreach Template:**
```
Subject: Partnership — Community Safety Map for [City]

Hi [Name],

Colours of Safety is a community-driven map marking queer-friendly 
venues and safe districts. We have [N] spaces mapped in [City] and 
growing.

Partnership options:
- Embed our map on your site (iframe or API)
- Cross-promote to your community
- Co-branded safety guides

[Link to map] | [Link to 1-page partnership deck]

[Name]
Founder, Colours of Safety
```

---

### 1.3 Reddit & Forums (Medium Impact, Free)

**Target Subreddits:**
- r/lgbt (2.8M members)
- r/ainbow (200K members)
- r/askgaybros (1.2M members)
- r/trans (400K members)
- r/solotravel (1.5M members)
- City-specific: r/brussels, r/amsterdam, r/london, r/nyc

**Post Strategy:**
- **Value-first:** "I built a map of queer-friendly spaces — what am I missing in [City]?"
- **AMA format:** "I'm mapping LGBTQ safe spaces worldwide — AMA"
- **Update posts:** Monthly "New features + cities added" updates
- **Never spam:** Post only when adding genuine value

**Timing:**
- Best: Tuesday-Thursday, 9-11am EST
- Worst: Weekends (low engagement)

---

### 1.4 TikTok / Instagram Reels (Viral Potential)

**Content Pillars:**

| Type | Example | Hook |
|------|---------|------|
| Travel safety | "POV: You're trans in [City] and need a safe cafe" | Relatable + useful |
| Before/after map | "This city had 0 safe spaces mapped 3 months ago" | Progress visual |
| User stories | "Someone marked this clinic as safe — here's why" | Emotional |
| Tutorial | "How to mark your favorite queer bar (takes 30 sec)" | Educational |

**Hashtag Strategy:**
- Primary: #lgbtq #safespaces #queertravel #transfriendly
- Niche: #queercafe #gaytravel #lgbtqsafety
- Trend-jacking: Monitor trending audio, adapt to safety theme

**Posting Schedule:**
- 3-5x/week on TikTok
- 2-3x/week on Instagram
- Cross-post to YouTube Shorts

---

### 1.5 Newsletter & Email (Retention Driver)

**Types:**

| Newsletter | Frequency | Content |
|------------|-----------|---------|
| Weekly Digest | Weekly | New safe spaces added this week |
| City Guides | Monthly | Deep-dive: "Safe Spaces in Lisbon" |
| Contributor Update | Bi-weekly | Your submission status, community stats |

**Growth Tactics:**
- Exit-intent popup: "Get weekly safe space updates for your city"
- Lead magnet: "Download: 50 Queer-Friendly Cafes in Europe"
- Referral program: "Invite 3 friends, unlock early access to new cities"

---

### 1.6 PR & Media (Credibility Boost)

**Target Publications:**
- LGBTQ media: Advocate, Out, Them, PinkNews
- Tech blogs: Product Hunt, BetaList, Hacker News (Show HN)
- Local news: City-specific queer publications
- Travel: Lonely Planet, Nomadic Matt

**Angles:**
- "Crowdsourced safety: The Wikipedia of queer spaces"
- "Tech solution to real-world LGBTQ safety"
- "Community moderation beats algorithms"

**Press Kit:**
- Founder story (why built this)
- Usage stats (users, places mapped, cities)
- Screenshots + demo video
- Testimonials from early users

---

### 1.7 Influencer Seeding (Trust Transfer)

**Tier Targets:**

| Tier | Followers | Approach | Offer |
|------|-----------|----------|-------|
| Micro | 1K-10K | DM directly | Free account, shoutout |
| Mid | 10K-100K | Email pitch | Exclusive preview, co-branded content |
| Macro | 100K+ | PR agency or intro | Paid partnership, equity discussion |

**Ideal Profiles:**
- LGBTQ travel bloggers
- Trans creators documenting transitions/safety
- Queer lifestyle YouTubers
- LGBTQ mental health advocates

---

## 2. Viral Loops & Referral Mechanics

### 2.1 Shareable Place Links

**Implementation:**
- Each place gets unique URL: `/place/[id]`
- OG image auto-generated with place name + safety rating
- One-click share button in marker popup

**Viral Triggers:**
- "Share this safe space with someone who needs it"
- "Help others find [Place Name]"

### 2.2 Contributor Recognition

**Public Contribution Feed:**
- Show "Recently added by [Username]" on homepage
- Anonymous option available
- Builds contributor identity + social proof

**Badges:**
- Pioneer (1st in a city)
- Guardian (10+ approved)
- Explorer (submitted in 3+ cities)

### 2.3 Invite System

**Referral Flow:**
1. User gets unique referral link in `/mine`
2. Referral lands on signup with `?ref=[username]`
3. Both get badge when referred user submits first place
4. Top referrers featured on community page

---

## 3. Conversion Optimization

### 3.1 Landing Page Variants

**By Traffic Source:**

| Source | Headline | CTA |
|--------|----------|-----|
| Reddit | "The community-built map of queer-friendly spaces" | "Browse [City]" |
| TikTok | "Find safe spaces near you in 10 seconds" | "Open Map" |
| Partner | "[Partner] + Colours of Safety" | "Explore Safe Spaces" |
| PR | "The Wikipedia of LGBTQ safety" | "See the Map" |

### 3.2 A/B Test Priorities

1. **Hero CTA:** "Browse Map" vs "Find Safe Spaces" vs "Explore [City]"
2. **Social proof placement:** Above map vs in legend vs footer
3. **Signup friction:** Email only vs email+password vs social auth
4. **First action post-signup:** Map view vs guided tour vs submit prompt

---

## 4. Analytics & Measurement

### 4.1 North Star Metric

**Primary:** Weekly Active Contributors (users who submit or review)

**Supporting:**
- Total places mapped
- Places per city (coverage depth)
- Approval rate (quality signal)
- Time to first submission (activation)

### 4.2 Channel Attribution

**UTM Strategy:**
```
?utm_source=reddit&utm_medium=social&utm_campaign=city_guide
?utm_source=prideorg&utm_medium=partnership&utm_campaign=embed
?utm_source=tiktok&utm_medium=video&utm_campaign=influencer
```

### 4.3 Dashboard Metrics

| Metric | Tool | Target |
|--------|------|--------|
| Monthly visitors | GA4 | 10K → 50K → 100K |
| Signup rate | GA4 | 5% → 10% |
| Contribution rate | Internal | 20% of signups submit within 7d |
| Viral coefficient | Referral tracking | K > 0.3 |
| Organic traffic % | GSC | 30% → 50% |

---

## 5. 90-Day Launch Roadmap

### Month 1: Foundation

**Week 1-2:**
- [ ] Complete SEO Phase 1 (meta, robots, sitemap)
- [ ] Set up GA4 + GSC
- [ ] Create social accounts (TikTok, Instagram, Twitter/X)
- [ ] Build press kit

**Week 3-4:**
- [ ] Implement SSR
- [ ] Add shareable place links
- [ ] Seed content on Reddit (3 value posts)
- [ ] Outreach to 10 LGBTQ orgs

### Month 2: Acceleration

**Week 5-6:**
- [ ] Launch on Product Hunt
- [ ] First influencer collaboration
- [ ] Publish 2 city guide blog posts
- [ ] Start TikTok content (3x/week)

**Week 7-8:**
- [ ] First partnership live (embed or cross-promo)
- [ ] Implement referral system
- [ ] A/B test landing page
- [ ] PR push to LGBTQ media

### Month 3: Scale

**Week 9-10:**
- [ ] Launch newsletter
- [ ] 3+ active partnerships
- [ ] 10K+ monthly visitors
- [ ] 500+ registered users

**Week 11-12:**
- [ ] Analyze channels, double down on winners
- [ ] Expand to 5+ cities with coverage
- [ ] Plan Month 4-6 strategy

---

## 6. Resource Requirements

| Item | Cost | Notes |
|------|------|-------|
| Design (OG images, press kit) | $500-1000 | One-time |
| Influencer seeding | $500-2000 | Micro-influencers |
| Content writer | $500/month | City guides, blog |
| PR agency (optional) | $2000/month | For macro coverage |
| Ads (testing) | $500/month | Reddit/TikTok test budget |

**Minimum viable:** $1500 first month, $500 ongoing
**Aggressive growth:** $5000 first month, $2000 ongoing

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Community backlash | Transparent moderation, clear guidelines, never gate safety info |
| Data inaccuracy | Multi-reviewer system, report button, confidence scores |
| Competitor copy | Open data ethos, community loyalty, first-mover advantage |
| Platform dependency | Build email list, own the relationship |
| Burnout | Sustainable posting schedule, focus on high-ROI channels |

---

## 8. Success Metrics (6-Month Targets)

| Metric | Baseline | 3 Months | 6 Months |
|--------|----------|----------|----------|
| Monthly visitors | 0 | 10,000 | 50,000 |
| Registered users | 0 | 500 | 2,500 |
| Places mapped | 0 | 200 | 1,000 |
| Cities covered | 1 | 5 | 15 |
| Active contributors | 0 | 100 | 400 |
| Partnerships | 0 | 3 | 10 |

---

*Next review: End of Month 1*
