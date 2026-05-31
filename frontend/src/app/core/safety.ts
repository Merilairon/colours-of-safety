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
  'cafe',
  'restaurant',
  'club',
  'community',
  'healthcare',
  'shop',
  'other',
];
