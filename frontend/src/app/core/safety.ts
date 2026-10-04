/** Maps a 1–5 safety rating to a colour and a human label. */
export function safetyColor(rating: number): string {
  switch (rating) {
    case 1:
      return '#d7263d'; // unsafe
    case 2:
      return '#f46036';
    case 3:
      return '#f4c430'; // mixed
    case 4:
      return '#7cb518';
    case 5:
    default:
      return '#2e933c'; // very safe / welcoming
  }
}

/** Secondary visual indicator (icon/pattern) for colour-blind accessibility. */
export function safetyIndicator(rating: number): string {
  // Unicode symbols that work alongside colors for accessibility
  // These provide shape/pattern differentiation for color-blind users
  switch (rating) {
    case 1:
      return '✕'; // X shape for unsafe
    case 2:
      return '△'; // triangle for caution
    case 3:
      return '◆'; // diamond for mixed
    case 4:
      return '✓'; // check for friendly
    case 5:
    default:
      return '★'; // star for very welcoming
  }
}

/**
 * Colour for the symbol drawn on top of a `safetyColor` fill. Yellow, orange and
 * light green are too light for white (under 3:1), so those get dark ink.
 */
export function safetySymbolColor(rating: number): string {
  return rating === 2 || rating === 3 || rating === 4 ? '#1d1f2b' : '#ffffff';
}

/** CSS pattern class for high-contrast / color-blind modes. */
export function safetyPatternClass(rating: number): string {
  switch (rating) {
    case 1:
      return 'safety-pattern-unsafe';
    case 2:
      return 'safety-pattern-caution';
    case 3:
      return 'safety-pattern-mixed';
    case 4:
      return 'safety-pattern-friendly';
    case 5:
    default:
      return 'safety-pattern-welcoming';
  }
}

export function safetyLabel(rating: number): string {
  return (
    {
      1: 'Unsafe',
      2: 'Caution',
      3: 'Mixed',
      4: 'Friendly',
      5: 'Very welcoming',
    }[rating] ?? 'Unknown'
  );
}

export const POI_CATEGORIES = [
  'bar',
  'bookstore',
  'cafe',
  'club',
  'community',
  'crisis_shelter',
  'healthcare',
  'hiv_sti_testing',
  'legal_aid',
  'restaurant',
  'religious_spiritual',
  'sexual_health_clinic',
  'shop',
  'support_group',
  'transgender_services',
  'youth_center',
  'other',
];

/** Human-readable labels for POI categories. */
export const POI_CATEGORY_LABELS: Record<string, string> = {
  bar: 'Bar / Pub',
  bookstore: 'LGBTQ+ Bookstore',
  cafe: 'Cafe',
  club: 'Nightclub',
  community: 'Community Space',
  crisis_shelter: 'Crisis Shelter',
  healthcare: 'Healthcare',
  hiv_sti_testing: 'HIV/STI Testing',
  legal_aid: 'Legal Aid',
  restaurant: 'Restaurant',
  religious_spiritual: 'Religious/Spiritual',
  sexual_health_clinic: 'Sexual Health Clinic',
  shop: 'Shop / Retail',
  support_group: 'Support Group',
  transgender_services: 'Transgender Services',
  youth_center: 'Youth Center',
  other: 'Other',
};

/** Neutral look for places nobody has rated yet (unconfirmed imports). */
export const UNRATED_COLOR = '#8a8d9c';
export const UNRATED_SYMBOL = '?';

interface Rated {
  source?: string;
  lastVerifiedAt?: string | null;
  safetyRating: number;
  ratingCount?: number;
  communityRating?: number | null;
}

/**
 * The rating to show for a place: the community average once people have
 * rated it, otherwise the stored rating if a person set or confirmed it
 * (community entries, imports with an approved edit). An unconfirmed
 * import's rating is the seeder's placeholder and is never shown (LSA-B12).
 */
export function displayRating(place: Rated): number | null {
  if (place.ratingCount && place.communityRating != null) {
    return Math.min(5, Math.max(1, Math.round(place.communityRating)));
  }
  const personSet = !place.source || place.source === 'community' || !!place.lastVerifiedAt;
  return personSet ? place.safetyRating : null;
}

export function ratingColor(rating: number | null): string {
  return rating == null ? UNRATED_COLOR : safetyColor(rating);
}

export function ratingSymbol(rating: number | null): string {
  return rating == null ? UNRATED_SYMBOL : safetyIndicator(rating);
}

export function ratingSymbolColor(rating: number | null): string {
  return rating == null ? '#ffffff' : safetySymbolColor(rating);
}

export function ratingLabel(rating: number | null): string {
  return rating == null ? 'Not yet rated' : safetyLabel(rating);
}

export const SOURCE_LABELS: Record<string, string> = {
  community: 'Community',
  openstreetmap: 'OpenStreetMap',
  wikidata: 'Wikidata',
  curated: 'Curated list',
  imported: 'an earlier bulk import',
};

/** Imports stay "not yet community-verified" until a person confirms them. */
export function isCommunityVerified(place: {
  source?: string;
  lastVerifiedAt?: string | null;
}): boolean {
  return !!place.lastVerifiedAt;
}
