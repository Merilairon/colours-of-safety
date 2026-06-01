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
