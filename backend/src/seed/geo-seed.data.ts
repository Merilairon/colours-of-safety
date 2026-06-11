import type { Polygon } from 'geojson';

export interface StaticDistrict {
  name: string;
  description: string;
  safetyRating: number;
  blendEdges: boolean;
  area: Polygon;
}

export interface StaticPoi {
  name: string;
  description: string;
  category: string;
  safetyRating: number;
  location: { type: 'Point'; coordinates: [number, number] };
  wheelchairAccessible: boolean;
}

/**
 * OSM lgbtq tag value → safety rating (1–5).
 * Source: GIS_DATA_SOURCES.md §2.1
 */
export const OSM_LGBTQ_SAFETY: Record<string, number> = {
  primary: 5,
  only: 5,
  welcome: 4,
  yes: 3,
  limited: 2,
};

/**
 * OSM amenity/shop/office/healthcare tag combinations → app category.
 * Source: GIS_DATA_SOURCES.md §3
 */
export function osmTagsToCategory(tags: Record<string, string>): string {
  const amenity = tags['amenity'] ?? '';
  const shop = tags['shop'] ?? '';
  const healthcare = tags['healthcare'] ?? '';
  const office = tags['office'] ?? '';
  const socialFacility = tags['social_facility'] ?? '';
  const transgender = tags['transgender'] ?? tags['trans_friendly'] ?? '';

  if (amenity === 'bar' || amenity === 'pub') return 'bar';
  if (amenity === 'cafe') return 'cafe';
  if (amenity === 'restaurant') return 'restaurant';
  if (amenity === 'nightclub') return 'club';
  if (amenity === 'community_centre') return 'community';
  if (amenity === 'youth_centre') return 'youth_center';
  if (amenity === 'place_of_worship') return 'religious_spiritual';
  if (amenity === 'social_facility') {
    if (socialFacility === 'shelter') return 'crisis_shelter';
    return 'support_group';
  }
  if (amenity === 'doctors' || amenity === 'clinic' || amenity === 'hospital')
    return 'healthcare';
  if (amenity === 'pharmacy') return 'healthcare';
  if (healthcare === 'sexual_health' || healthcare === 'clinic')
    return 'sexual_health_clinic';
  if (healthcare === 'centre' || healthcare === 'yes') return 'hiv_sti_testing';
  if (shop === 'books') return 'bookstore';
  if (shop && shop !== '') return 'shop';
  if (office === 'ngo' || office === 'association') {
    if (transgender) return 'transgender_services';
    return 'support_group';
  }
  if (office === 'lawyer') return 'legal_aid';

  return 'other';
}

/**
 * Known LGBTQ+ districts with hand-curated safety ratings and approximate
 * bounding-box polygons. Polygons are intentionally coarse rectangles — they
 * are intended as a seed baseline and can be refined by reviewers in the app.
 *
 * Coordinate order: [longitude, latitude] — GeoJSON standard.
 * Source: GIS_DATA_SOURCES.md §2.6
 */
export const KNOWN_DISTRICTS: StaticDistrict[] = [
  {
    name: 'Le Marais',
    description:
      'Historic LGBTQ+ quarter of Paris, centred around Rue Sainte-Croix-de-la-Bretonnerie.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [2.3488, 48.8555],
          [2.3563, 48.8555],
          [2.3563, 48.8605],
          [2.3488, 48.8605],
          [2.3488, 48.8555],
        ],
      ],
    },
  },
  {
    name: 'Castro District',
    description:
      "San Francisco's iconic LGBTQ+ neighbourhood, one of the world's most welcoming.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-122.4378, 37.7587],
          [-122.4278, 37.7587],
          [-122.4278, 37.764],
          [-122.4378, 37.764],
          [-122.4378, 37.7587],
        ],
      ],
    },
  },
  {
    name: 'Canal Street / Gay Village',
    description: "Manchester's vibrant LGBTQ+ village along Canal Street.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-2.238, 53.476],
          [-2.232, 53.476],
          [-2.232, 53.479],
          [-2.238, 53.479],
          [-2.238, 53.476],
        ],
      ],
    },
  },
  {
    name: 'Soho (Old Compton Street)',
    description:
      "London's LGBTQ+ hub centred on Old Compton Street in the West End.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-0.134, 51.512],
          [-0.128, 51.512],
          [-0.128, 51.516],
          [-0.134, 51.516],
          [-0.134, 51.512],
        ],
      ],
    },
  },
  {
    name: 'Schöneberg',
    description: "Berlin's traditional LGBTQ+ district around Nollendorfplatz.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [13.348, 52.494],
          [13.362, 52.494],
          [13.362, 52.502],
          [13.348, 52.502],
          [13.348, 52.494],
        ],
      ],
    },
  },
  {
    name: 'Reguliersdwarsstraat area',
    description:
      "Amsterdam's main LGBTQ+ street and surrounding canal district.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.89, 52.365],
          [4.898, 52.365],
          [4.898, 52.37],
          [4.89, 52.37],
          [4.89, 52.365],
        ],
      ],
    },
  },
  {
    name: 'Chueca',
    description: "Madrid's LGBTQ+ neighbourhood, one of Europe's most vibrant.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-3.7, 40.424],
          [-3.694, 40.424],
          [-3.694, 40.43],
          [-3.7, 40.43],
          [-3.7, 40.424],
        ],
      ],
    },
  },
  {
    name: 'Sitges Old Town',
    description:
      'Coastal town near Barcelona, internationally known as an LGBTQ+ destination.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [1.809, 41.234],
          [1.816, 41.234],
          [1.816, 41.239],
          [1.809, 41.239],
          [1.809, 41.234],
        ],
      ],
    },
  },
  {
    name: 'Sint-Joost-ten-Node / Matongé',
    description:
      'Diverse Brussels municipality with a welcoming and multicultural LGBTQ+ presence.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.37, 50.852],
          [4.38, 50.852],
          [4.38, 50.858],
          [4.37, 50.858],
          [4.37, 50.852],
        ],
      ],
    },
  },
  {
    name: 'Ixelles',
    description:
      'Brussels municipality with a dense café culture, progressive atmosphere, and visible LGBTQ+ community.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.354, 50.828],
          [4.38, 50.828],
          [4.38, 50.847],
          [4.354, 50.847],
          [4.354, 50.828],
        ],
      ],
    },
  },
];

/**
 * Hand-curated seed POIs for Brussels — covers well-known LGBTQ+ venues
 * that are unlikely to change frequently and are reliably safe.
 * Source: public knowledge + OSM verification.
 */
export const KNOWN_POIS: StaticPoi[] = [
  {
    name: 'La Démence (Fuse Club)',
    description: "Europe's largest monthly gay party, held at Fuse, Brussels.",
    category: 'club',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3516, 50.8446] },
    wheelchairAccessible: false,
  },
  {
    name: 'Belgica Bar',
    description: 'Iconic Brussels gay bar on Rue du Marché au Charbon.',
    category: 'bar',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3509, 50.8457] },
    wheelchairAccessible: false,
  },
  {
    name: 'Homo Erectus',
    description:
      'Long-standing LGBTQ+ bar on the Rue des Pierres strip, Brussels.',
    category: 'bar',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3502, 50.8459] },
    wheelchairAccessible: false,
  },
  {
    name: 'Maison Arc-en-Ciel (Rainbow House)',
    description:
      'Belgian LGBTQ+ community centre offering support, events and legal resources.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3547, 50.8497] },
    wheelchairAccessible: true,
  },
  {
    name: 'Çavaria vzw',
    description:
      'Flemish umbrella organisation for LGBTQ+ associations — information and referrals.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3483, 50.8503] },
    wheelchairAccessible: true,
  },
  {
    name: 'Ex Æquo',
    description:
      'Brussels sexual health centre specialising in HIV/STI prevention for gay and bi men.',
    category: 'hiv_sti_testing',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3521, 50.8512] },
    wheelchairAccessible: true,
  },
];
