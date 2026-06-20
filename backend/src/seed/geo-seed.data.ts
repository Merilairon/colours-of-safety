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
 * Source: LGBTQIA_EUROPE_SAFETY_REPORT.md + GIS_DATA_SOURCES.md §2.6
 */
export const KNOWN_DISTRICTS: StaticDistrict[] = [
  // ── Netherlands ────────────────────────────────────────────────────────────
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
    name: 'Jordaan',
    description:
      'Gay-friendly neighbourhood in Amsterdam with welcoming cafés and canal atmosphere.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.877, 52.371],
          [4.889, 52.371],
          [4.889, 52.381],
          [4.877, 52.381],
          [4.877, 52.371],
        ],
      ],
    },
  },
  {
    name: 'De Pijp',
    description:
      'Liberal, diverse and inclusive Amsterdam neighbourhood with a strong LGBTQ+ presence.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.893, 52.352],
          [4.908, 52.352],
          [4.908, 52.363],
          [4.893, 52.363],
          [4.893, 52.352],
        ],
      ],
    },
  },
  {
    name: 'Rotterdam Schouwburgplein',
    description:
      'Growing queer scene in Rotterdam city centre with inclusive events.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.472, 51.919],
          [4.483, 51.919],
          [4.483, 51.925],
          [4.472, 51.925],
          [4.472, 51.919],
        ],
      ],
    },
  },
  // ── Belgium ────────────────────────────────────────────────────────────────
  {
    name: 'Rue du Marché au Charbon',
    description:
      'Heart of the Brussels gay scene; bars and clubs along this iconic street.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.347, 50.844],
          [4.355, 50.844],
          [4.355, 50.849],
          [4.347, 50.849],
          [4.347, 50.844],
        ],
      ],
    },
  },
  {
    name: 'Ixelles / Elsene',
    description:
      'Liberal, artsy Brussels municipality with strong LGBTQ+-friendly atmosphere.',
    safetyRating: 5,
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
    name: 'Antwerp City Centre',
    description:
      'Very gay-friendly Belgian city with annual Pride and vibrant community.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.394, 51.213],
          [4.413, 51.213],
          [4.413, 51.225],
          [4.394, 51.225],
          [4.394, 51.213],
        ],
      ],
    },
  },
  {
    name: 'Ghent Sint-Pietersnieuwstraat',
    description:
      'Student city with inclusive atmosphere and active LGBTQ+ presence.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [3.718, 51.046],
          [3.728, 51.046],
          [3.728, 51.053],
          [3.718, 51.053],
          [3.718, 51.046],
        ],
      ],
    },
  },
  // ── Germany ────────────────────────────────────────────────────────────────
  {
    name: 'Schöneberg',
    description: "Berlin's historic gay village centred on Nollendorfplatz.",
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
    name: 'Kreuzberg',
    description: 'Queer-friendly, alternative and diverse Berlin district.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [13.378, 52.493],
          [13.415, 52.493],
          [13.415, 52.508],
          [13.378, 52.508],
          [13.378, 52.493],
        ],
      ],
    },
  },
  {
    name: 'Prenzlauer Berg',
    description: 'Liberal, family-friendly LGBTQ+ area in Berlin.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [13.407, 52.527],
          [13.432, 52.527],
          [13.432, 52.543],
          [13.407, 52.543],
          [13.407, 52.527],
        ],
      ],
    },
  },
  {
    name: 'Glockenbachviertel',
    description: "Munich's gay village — bars, cafés and community spaces.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [11.569, 48.127],
          [11.582, 48.127],
          [11.582, 48.135],
          [11.569, 48.135],
          [11.569, 48.127],
        ],
      ],
    },
  },
  {
    name: 'Hamburg St. Georg',
    description: "Hamburg's main gay district, centred on Lange Reihe street.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [10.007, 53.552],
          [10.02, 53.552],
          [10.02, 53.561],
          [10.007, 53.561],
          [10.007, 53.552],
        ],
      ],
    },
  },
  {
    name: 'Cologne Heumarkt / Rudolfplatz',
    description:
      "Home to one of Germany's largest Pride events and a lively LGBTQ+ scene.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [6.955, 50.931],
          [6.969, 50.931],
          [6.969, 50.941],
          [6.955, 50.941],
          [6.955, 50.931],
        ],
      ],
    },
  },
  // ── France ─────────────────────────────────────────────────────────────────
  {
    name: 'Le Marais',
    description:
      "Europe's most famous gay village, centred on Rue Sainte-Croix-de-la-Bretonnerie.",
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
    name: 'Beaubourg / Les Halles',
    description:
      'Adjacent to Le Marais, generally welcoming with diverse crowd.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [2.347, 48.858],
          [2.357, 48.858],
          [2.357, 48.864],
          [2.347, 48.864],
          [2.347, 48.858],
        ],
      ],
    },
  },
  {
    name: "Lyon Presqu'île",
    description: 'Active LGBTQ+ scene in Lyon city centre.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [4.826, 45.757],
          [4.836, 45.757],
          [4.836, 45.767],
          [4.826, 45.767],
          [4.826, 45.757],
        ],
      ],
    },
  },
  {
    name: 'Montpellier Centre',
    description: 'Progressive student city with welcoming LGBTQ+ community.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [3.871, 43.606],
          [3.882, 43.606],
          [3.882, 43.614],
          [3.871, 43.614],
          [3.871, 43.606],
        ],
      ],
    },
  },
  // ── Spain ──────────────────────────────────────────────────────────────────
  {
    name: 'Chueca',
    description: "Europe's most celebrated gay barrio in Madrid.",
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
    name: 'Gaixample',
    description:
      "Barcelona's gay neighbourhood — portmanteau of 'gay' and 'Eixample'.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [2.154, 41.383],
          [2.166, 41.383],
          [2.166, 41.392],
          [2.154, 41.392],
          [2.154, 41.383],
        ],
      ],
    },
  },
  {
    name: 'Sitges Town',
    description: 'Premier LGBTQ+ beach resort town near Barcelona.',
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
    name: 'Gran Canaria — Maspalomas',
    description: 'World-famous LGBTQ+ resort area in the Canary Islands.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-15.596, 27.741],
          [-15.567, 27.741],
          [-15.567, 27.762],
          [-15.596, 27.762],
          [-15.596, 27.741],
        ],
      ],
    },
  },
  {
    name: 'Torremolinos',
    description:
      'Historic first gay beach destination in Spain, on the Costa del Sol.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-4.506, 36.618],
          [-4.491, 36.618],
          [-4.491, 36.629],
          [-4.506, 36.629],
          [-4.506, 36.618],
        ],
      ],
    },
  },
  {
    name: 'Seville Alameda de Hércules',
    description:
      'Welcoming Seville boulevard with Pride events and LGBTQ+ bars.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-5.998, 37.396],
          [-5.989, 37.396],
          [-5.989, 37.403],
          [-5.998, 37.403],
          [-5.998, 37.396],
        ],
      ],
    },
  },
  // ── Portugal ───────────────────────────────────────────────────────────────
  {
    name: 'Príncipe Real',
    description:
      "Lisbon's main LGBTQ+ neighbourhood — elegant, welcoming, vibrant.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-9.149, 38.713],
          [-9.141, 38.713],
          [-9.141, 38.719],
          [-9.149, 38.719],
          [-9.149, 38.713],
        ],
      ],
    },
  },
  {
    name: 'Bairro Alto',
    description: 'Lisbon nightlife hub, very welcoming to LGBTQ+ visitors.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-9.147, 38.708],
          [-9.139, 38.708],
          [-9.139, 38.715],
          [-9.147, 38.715],
          [-9.147, 38.708],
        ],
      ],
    },
  },
  {
    name: 'Porto Bonfim / Cedofeita',
    description: 'Growing LGBTQ+ scene in Porto.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-8.634, 41.151],
          [-8.622, 41.151],
          [-8.622, 41.159],
          [-8.634, 41.159],
          [-8.634, 41.151],
        ],
      ],
    },
  },
  // ── Italy ──────────────────────────────────────────────────────────────────
  {
    name: 'Porta Venezia',
    description: "Italy's most established gay village in Milan.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [9.204, 45.471],
          [9.215, 45.471],
          [9.215, 45.479],
          [9.204, 45.479],
          [9.204, 45.471],
        ],
      ],
    },
  },
  {
    name: 'Testaccio',
    description: "Rome's gay nightlife hub.",
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [12.472, 41.874],
          [12.484, 41.874],
          [12.484, 41.882],
          [12.472, 41.882],
          [12.472, 41.874],
        ],
      ],
    },
  },
  {
    name: 'Bologna University Quarter',
    description: 'Progressive student city, most inclusive area in Bologna.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [11.343, 44.495],
          [11.357, 44.495],
          [11.357, 44.503],
          [11.343, 44.503],
          [11.343, 44.495],
        ],
      ],
    },
  },
  // ── Greece ─────────────────────────────────────────────────────────────────
  {
    name: 'Mykonos Town (Chora)',
    description: "Europe's most iconic gay island destination.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [25.322, 37.443],
          [25.336, 37.443],
          [25.336, 37.452],
          [25.322, 37.452],
          [25.322, 37.443],
        ],
      ],
    },
  },
  {
    name: 'Gazi district',
    description: "Athens' main gay neighbourhood with bars and clubs.",
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [23.703, 37.975],
          [23.714, 37.975],
          [23.714, 37.983],
          [23.703, 37.983],
          [23.703, 37.975],
        ],
      ],
    },
  },
  // ── Malta ──────────────────────────────────────────────────────────────────
  {
    name: 'Valletta City Centre',
    description:
      'Very welcoming Maltese capital — consistently top ILGA-Europe ranked.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.508, 35.896],
          [14.52, 35.896],
          [14.52, 35.903],
          [14.508, 35.903],
          [14.508, 35.896],
        ],
      ],
    },
  },
  {
    name: "St Julian's / Paceville",
    description: 'Main nightlife and LGBTQ+ hub in Malta.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.489, 35.917],
          [14.499, 35.917],
          [14.499, 35.924],
          [14.489, 35.924],
          [14.489, 35.917],
        ],
      ],
    },
  },
  // ── Switzerland ────────────────────────────────────────────────────────────
  {
    name: 'Zürich Langstrasse',
    description: "Zurich's queer hub — diverse, inclusive street scene.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [8.528, 47.374],
          [8.538, 47.374],
          [8.538, 47.382],
          [8.528, 47.382],
          [8.528, 47.374],
        ],
      ],
    },
  },
  {
    name: 'Geneva Pâquis',
    description: 'Diverse, LGBTQ+-friendly Geneva neighbourhood.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [6.146, 46.208],
          [6.156, 46.208],
          [6.156, 46.214],
          [6.146, 46.214],
          [6.146, 46.208],
        ],
      ],
    },
  },
  // ── Austria ────────────────────────────────────────────────────────────────
  {
    name: 'Naschmarkt area',
    description: 'Vienna LGBTQ+ bars and nightlife hub.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [16.357, 48.198],
          [16.369, 48.198],
          [16.369, 48.205],
          [16.357, 48.205],
          [16.357, 48.198],
        ],
      ],
    },
  },
  {
    name: 'Wieden / Margareten',
    description:
      'Young, progressive Vienna districts with welcoming demographic.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [16.358, 48.188],
          [16.371, 48.188],
          [16.371, 48.198],
          [16.358, 48.198],
          [16.358, 48.188],
        ],
      ],
    },
  },
  // ── Sweden ─────────────────────────────────────────────────────────────────
  {
    name: 'Södermalm (SoFo)',
    description: "Stockholm's gay-friendly hub — bars, culture and community.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [18.063, 59.312],
          [18.082, 59.312],
          [18.082, 59.322],
          [18.063, 59.322],
          [18.063, 59.312],
        ],
      ],
    },
  },
  {
    name: 'Malmö Möllevångstorget',
    description: 'Diverse, very inclusive neighbourhood in Malmö.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [13.001, 55.585],
          [13.014, 55.585],
          [13.014, 55.592],
          [13.001, 55.592],
          [13.001, 55.585],
        ],
      ],
    },
  },
  // ── Norway ─────────────────────────────────────────────────────────────────
  {
    name: 'Grünerløkka',
    description: 'Bohemian, very LGBTQ+-friendly Oslo neighbourhood.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [10.751, 59.922],
          [10.766, 59.922],
          [10.766, 59.932],
          [10.751, 59.932],
          [10.751, 59.922],
        ],
      ],
    },
  },
  {
    name: 'Youngstorget',
    description: 'Oslo Pride epicentre and welcoming city square.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [10.747, 59.914],
          [10.757, 59.914],
          [10.757, 59.92],
          [10.747, 59.92],
          [10.747, 59.914],
        ],
      ],
    },
  },
  // ── Denmark ────────────────────────────────────────────────────────────────
  {
    name: 'Studiestræde / Copenhagen Gay Street',
    description: "Copenhagen's queer hub — bars, clubs and community spaces.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [12.561, 55.678],
          [12.571, 55.678],
          [12.571, 55.684],
          [12.561, 55.684],
          [12.561, 55.678],
        ],
      ],
    },
  },
  {
    name: 'Vesterbro',
    description: 'Creative, inclusive Copenhagen neighbourhood.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [12.542, 55.667],
          [12.562, 55.667],
          [12.562, 55.678],
          [12.542, 55.678],
          [12.542, 55.667],
        ],
      ],
    },
  },
  // ── Finland ────────────────────────────────────────────────────────────────
  {
    name: 'Kallio',
    description: "Helsinki's most LGBTQ+-friendly neighbourhood.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [24.946, 60.183],
          [24.963, 60.183],
          [24.963, 60.193],
          [24.946, 60.193],
          [24.946, 60.183],
        ],
      ],
    },
  },
  // ── Iceland ────────────────────────────────────────────────────────────────
  {
    name: 'Reykjavik City Centre',
    description:
      "Entire city centre is effectively LGBTQ+-safe — one of the world's most welcoming capitals.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-22.007, 64.141],
          [-21.99, 64.141],
          [-21.99, 64.15],
          [-22.007, 64.15],
          [-22.007, 64.141],
        ],
      ],
    },
  },
  // ── Ireland ────────────────────────────────────────────────────────────────
  {
    name: "George's Street / Camden",
    description:
      "Dublin's gay village — Ireland's most celebrated LGBTQ+ area.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [-6.266, 53.339],
          [-6.257, 53.339],
          [-6.257, 53.344],
          [-6.266, 53.344],
          [-6.266, 53.339],
        ],
      ],
    },
  },
  // ── Luxembourg ─────────────────────────────────────────────────────────────
  {
    name: 'Luxembourg City Centre',
    description:
      'Welcoming capital with active Rosa Lëtzebuerg LGBTQ+ community.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [6.123, 49.609],
          [6.136, 49.609],
          [6.136, 49.616],
          [6.123, 49.616],
          [6.123, 49.609],
        ],
      ],
    },
  },
  // ── Czech Republic ─────────────────────────────────────────────────────────
  {
    name: 'Vinohrady',
    description:
      "Prague's established gay village with bars, cafés and community.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.44, 50.073],
          [14.456, 50.073],
          [14.456, 50.082],
          [14.44, 50.082],
          [14.44, 50.073],
        ],
      ],
    },
  },
  {
    name: 'Žižkov',
    description: 'Alternative, very LGBTQ+-friendly Prague neighbourhood.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.451, 50.081],
          [14.469, 50.081],
          [14.469, 50.091],
          [14.451, 50.091],
          [14.451, 50.081],
        ],
      ],
    },
  },
  {
    name: 'Brno City Centre',
    description:
      'Progressive second city of Czech Republic with welcoming queer scene.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [16.604, 49.191],
          [16.617, 49.191],
          [16.617, 49.198],
          [16.604, 49.198],
          [16.604, 49.191],
        ],
      ],
    },
  },
  // ── Slovenia ───────────────────────────────────────────────────────────────
  {
    name: 'Metelkova',
    description:
      'Autonomous cultural zone in Ljubljana — LGBTQ+-welcoming squat turned cultural centre.',
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.514, 46.057],
          [14.523, 46.057],
          [14.523, 46.062],
          [14.514, 46.062],
          [14.514, 46.057],
        ],
      ],
    },
  },
  {
    name: 'Ljubljana City Centre',
    description:
      'Very welcoming Slovenian capital with active LGBTQ+ community.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [14.502, 46.048],
          [14.517, 46.048],
          [14.517, 46.057],
          [14.502, 46.057],
          [14.502, 46.048],
        ],
      ],
    },
  },
  // ── Croatia ────────────────────────────────────────────────────────────────
  {
    name: 'Gornji Grad',
    description: "Zagreb's most LGBTQ+-friendly area in the upper town.",
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [15.974, 45.812],
          [15.983, 45.812],
          [15.983, 45.818],
          [15.974, 45.818],
          [15.974, 45.812],
        ],
      ],
    },
  },
  {
    name: 'Hvar Island',
    description:
      'Major international tourist destination in Croatia, welcoming to LGBTQ+ visitors.',
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [16.437, 43.171],
          [16.45, 43.171],
          [16.45, 43.178],
          [16.437, 43.178],
          [16.437, 43.171],
        ],
      ],
    },
  },
  // ── Estonia ────────────────────────────────────────────────────────────────
  {
    name: 'Kalamaja',
    description:
      "Tallinn's most progressive neighbourhood — arts, culture, LGBTQ+-welcoming.",
    safetyRating: 5,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [24.722, 59.442],
          [24.736, 59.442],
          [24.736, 59.451],
          [24.722, 59.451],
          [24.722, 59.442],
        ],
      ],
    },
  },
  // ── Baltic States ──────────────────────────────────────────────────────────
  {
    name: 'Centrs',
    description:
      "Riga's most tolerant district and centre of Latvian LGBTQ+ life.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [24.101, 56.943],
          [24.118, 56.943],
          [24.118, 56.953],
          [24.101, 56.953],
          [24.101, 56.943],
        ],
      ],
    },
  },
  {
    name: 'Užupis',
    description:
      "Vilnius' self-declared bohemian 'republic' — the most welcoming area in Lithuania.",
    safetyRating: 4,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [25.294, 54.679],
          [25.303, 54.679],
          [25.303, 54.685],
          [25.294, 54.685],
          [25.294, 54.679],
        ],
      ],
    },
  },
  // ── Poland ─────────────────────────────────────────────────────────────────
  {
    name: 'Powiśle',
    description: "Warsaw's most LGBTQ+-friendly neighbourhood.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [21.027, 52.236],
          [21.04, 52.236],
          [21.04, 52.244],
          [21.027, 52.244],
          [21.027, 52.236],
        ],
      ],
    },
  },
  {
    name: 'Kazimierz',
    description:
      'Historic Kraków district with pockets of tolerance in an alternative atmosphere.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [19.942, 50.048],
          [19.955, 50.048],
          [19.955, 50.056],
          [19.942, 50.056],
          [19.942, 50.048],
        ],
      ],
    },
  },
  // ── Hungary ────────────────────────────────────────────────────────────────
  {
    name: 'District VII (Erzsébetváros)',
    description:
      "Budapest's ruin bar district — some LGBTQ+ venues remain despite hostile national climate.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [19.063, 47.498],
          [19.078, 47.498],
          [19.078, 47.507],
          [19.063, 47.507],
          [19.063, 47.498],
        ],
      ],
    },
  },
  // ── Romania ────────────────────────────────────────────────────────────────
  {
    name: 'Floreasca / Dorobanți',
    description:
      'Relatively tolerant upper-class Bucharest area with some welcoming venues.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [26.094, 44.461],
          [26.108, 44.461],
          [26.108, 44.47],
          [26.094, 44.47],
          [26.094, 44.461],
        ],
      ],
    },
  },
  {
    name: 'Cluj-Napoca City Centre',
    description: 'Most progressive city in Romania with student population.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [23.585, 46.767],
          [23.6, 46.767],
          [23.6, 46.776],
          [23.585, 46.776],
          [23.585, 46.767],
        ],
      ],
    },
  },
  // ── Serbia ─────────────────────────────────────────────────────────────────
  {
    name: 'Savamala',
    description: "Belgrade's creative district and most tolerant area.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [20.444, 44.813],
          [20.457, 44.813],
          [20.457, 44.821],
          [20.444, 44.821],
          [20.444, 44.813],
        ],
      ],
    },
  },
  // ── Albania ────────────────────────────────────────────────────────────────
  {
    name: 'Blloku',
    description:
      "Tirana's most cosmopolitan neighbourhood with some LGBTQ+ venues.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [19.813, 41.319],
          [19.824, 41.319],
          [19.824, 41.326],
          [19.813, 41.326],
          [19.813, 41.319],
        ],
      ],
    },
  },
  // ── Montenegro ─────────────────────────────────────────────────────────────
  {
    name: 'Budva Old Town',
    description:
      'Tourist area on Montenegrin coast, more open than inland cities.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [18.836, 42.279],
          [18.847, 42.279],
          [18.847, 42.286],
          [18.836, 42.286],
          [18.836, 42.279],
        ],
      ],
    },
  },
  // ── Bulgaria ───────────────────────────────────────────────────────────────
  {
    name: 'Lozenets / Studentski Grad',
    description: 'Most tolerant areas in Sofia for LGBTQ+ people.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [23.322, 42.664],
          [23.338, 42.664],
          [23.338, 42.674],
          [23.322, 42.674],
          [23.322, 42.664],
        ],
      ],
    },
  },
  // ── Ukraine ────────────────────────────────────────────────────────────────
  {
    name: 'Podil',
    description:
      "Kyiv's most LGBTQ+-friendly area pre-war. Safety uncertain due to ongoing conflict.",
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [30.512, 50.463],
          [30.527, 50.463],
          [30.527, 50.473],
          [30.512, 50.473],
          [30.512, 50.463],
        ],
      ],
    },
  },
  // ── Moldova ────────────────────────────────────────────────────────────────
  {
    name: 'Centru Chisinau',
    description: 'Most tolerant district in Chișinău.',
    safetyRating: 2,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [28.83, 47.017],
          [28.845, 47.017],
          [28.845, 47.025],
          [28.83, 47.025],
          [28.83, 47.017],
        ],
      ],
    },
  },
  // ── Bosnia & Herzegovina ───────────────────────────────────────────────────
  {
    name: 'Sarajevo Centre',
    description:
      'Marginally safer for discreet tourists — public LGBTQ+ expression remains risky.',
    safetyRating: 2,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [18.408, 43.849],
          [18.424, 43.849],
          [18.424, 43.857],
          [18.408, 43.857],
          [18.408, 43.849],
        ],
      ],
    },
  },
  // ── Slovakia ───────────────────────────────────────────────────────────────
  {
    name: 'Bratislava Old Town',
    description:
      'Most tolerant area in Slovakia; small queer scene, annual Pride held here.',
    safetyRating: 3,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [17.104, 48.138],
          [17.118, 48.138],
          [17.118, 48.146],
          [17.104, 48.146],
          [17.104, 48.138],
        ],
      ],
    },
  },
  // ── North Macedonia ────────────────────────────────────────────────────────
  {
    name: 'Skopje Centre',
    description:
      'Very limited tolerance in North Macedonia capital — proceed with caution.',
    safetyRating: 2,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [21.427, 41.994],
          [21.439, 41.994],
          [21.439, 42.002],
          [21.427, 42.002],
          [21.427, 41.994],
        ],
      ],
    },
  },
  // ── Kosovo ─────────────────────────────────────────────────────────────────
  {
    name: 'Pristina Centre',
    description:
      'Minimal tolerance; small NGO presence but very limited LGBTQ+ visibility.',
    safetyRating: 2,
    blendEdges: true,
    area: {
      type: 'Polygon',
      coordinates: [
        [
          [21.155, 42.659],
          [21.167, 42.659],
          [21.167, 42.666],
          [21.155, 42.666],
          [21.155, 42.659],
        ],
      ],
    },
  },
];

/**
 * Hand-curated seed POIs covering named LGBTQ+ venues, organisations, bars,
 * memorials and health centres across Europe.
 * Source: LGBTQIA_EUROPE_SAFETY_REPORT.md + public knowledge + OSM verification.
 */
export const KNOWN_POIS: StaticPoi[] = [
  // ── Belgium — Brussels ─────────────────────────────────────────────────────
  {
    name: 'La Démence (Fuse Club)',
    description:
      "Europe's largest monthly gay party, held at Fuse club, Brussels.",
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
    name: 'Tels Quels',
    description: 'Leading LGBTQ+ community centre in Brussels.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.3536, 50.8491] },
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
  // ── Netherlands — Amsterdam ────────────────────────────────────────────────
  {
    name: 'Homomonument',
    description: 'Iconic LGBTQ+ memorial in Amsterdam, inaugurated 1987.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.8872, 52.3748] },
    wheelchairAccessible: true,
  },
  {
    name: 'COC Nederland HQ',
    description:
      "World's oldest LGBTQ+ organisation (est. 1946), Amsterdam headquarters.",
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.8926, 52.3712] },
    wheelchairAccessible: true,
  },
  {
    name: 'Pink Point',
    description: 'LGBTQ+ information kiosk near the Homomonument, Amsterdam.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [4.8876, 52.3751] },
    wheelchairAccessible: true,
  },
  // ── Germany — Berlin ───────────────────────────────────────────────────────
  {
    name: 'Nollendorfplatz',
    description:
      'Centre of Berlin gay life — square in the heart of Schöneberg.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [13.3535, 52.4993] },
    wheelchairAccessible: true,
  },
  {
    name: 'Schwules Museum',
    description: "World's largest LGBTQ+ museum, Berlin.",
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [13.3515, 52.4982] },
    wheelchairAccessible: true,
  },
  {
    name: 'Berghain',
    description:
      'Iconic queer techno club in Berlin, internationally renowned.',
    category: 'club',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [13.4432, 52.5112] },
    wheelchairAccessible: false,
  },
  // ── France — Paris ─────────────────────────────────────────────────────────
  {
    name: 'Centre LGBT+ Paris-IDF',
    description: 'Main LGBTQ+ community centre for Paris and Île-de-France.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [2.3536, 48.8583] },
    wheelchairAccessible: true,
  },
  // ── Luxembourg ─────────────────────────────────────────────────────────────
  {
    name: 'Rosa Lëtzebuerg HQ',
    description: 'Main LGBTQ+ organisation in Luxembourg.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [6.1296, 49.6117] },
    wheelchairAccessible: true,
  },
  // ── Switzerland ────────────────────────────────────────────────────────────
  {
    name: 'HAZ (Homosexuelle Arbeitsgruppen Zürich)',
    description: 'Historic LGBTQ+ community centre in Zurich.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [8.532, 47.378] },
    wheelchairAccessible: true,
  },
  // ── Austria — Vienna ───────────────────────────────────────────────────────
  {
    name: 'Café Savoy',
    description:
      "Historic gay café in Vienna, a landmark of the city's queer scene.",
    category: 'cafe',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [16.3602, 48.1994] },
    wheelchairAccessible: false,
  },
  {
    name: 'HOSI Wien',
    description:
      'Main LGBTQ+ organisation in Vienna — counselling, events, community.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [16.3728, 48.2052] },
    wheelchairAccessible: true,
  },
  // ── Sweden ─────────────────────────────────────────────────────────────────
  {
    name: 'RFSL Stockholm',
    description:
      'National LGBTQ+ organisation of Sweden, Stockholm headquarters.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [18.0717, 59.3163] },
    wheelchairAccessible: true,
  },
  // ── Norway ─────────────────────────────────────────────────────────────────
  {
    name: 'FRI (LLH) Norway HQ',
    description: 'Main LGBTQ+ organisation in Norway, Oslo headquarters.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [10.7491, 59.9147] },
    wheelchairAccessible: true,
  },
  // ── Denmark ────────────────────────────────────────────────────────────────
  {
    name: 'LGBT+ Denmark HQ',
    description: 'National LGBTQ+ organisation of Denmark, Copenhagen.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [12.5643, 55.6808] },
    wheelchairAccessible: true,
  },
  // ── Finland ────────────────────────────────────────────────────────────────
  {
    name: 'SETA Finland HQ',
    description: 'Main LGBTQ+ organisation in Finland, Helsinki.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [24.9417, 60.1696] },
    wheelchairAccessible: true,
  },
  // ── Iceland ────────────────────────────────────────────────────────────────
  {
    name: "Samtökin '78",
    description:
      'National LGBTQ+ organisation of Iceland, est. 1978. Reykjavik.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-21.9332, 64.1452] },
    wheelchairAccessible: true,
  },
  {
    name: 'Laugavegur Street',
    description:
      'Main social street in Reykjavik with LGBTQ+ venues and welcoming bars.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-21.9246, 64.1438] },
    wheelchairAccessible: true,
  },
  // ── Ireland — Dublin ───────────────────────────────────────────────────────
  {
    name: 'The George',
    description:
      "Ireland's most famous gay bar, est. 1985. South Great George's Street, Dublin.",
    category: 'bar',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-6.2647, 53.3424] },
    wheelchairAccessible: false,
  },
  {
    name: 'Pantibar',
    description:
      'Iconic Dublin drag bar and community hub, run by drag queen Panti Bliss.',
    category: 'bar',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-6.2694, 53.3481] },
    wheelchairAccessible: false,
  },
  // ── Spain ──────────────────────────────────────────────────────────────────
  {
    name: 'COGAM',
    description:
      'Main LGBTQ+ organisation in Madrid — community, legal aid, support groups.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-3.6981, 40.4262] },
    wheelchairAccessible: true,
  },
  {
    name: 'Casal Lambda',
    description: 'LGBTQ+ community centre and library in Barcelona.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [2.1763, 41.3841] },
    wheelchairAccessible: true,
  },
  {
    name: 'Super Paradise Beach',
    description: 'World-famous LGBTQ+ beach on Mykonos island, Greece.',
    category: 'community',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [25.3512, 37.4198] },
    wheelchairAccessible: false,
  },
  // ── Portugal ───────────────────────────────────────────────────────────────
  {
    name: 'ILGA Portugal HQ',
    description: 'Main national LGBTQ+ organisation in Portugal, Lisbon.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [-9.1439, 38.7163] },
    wheelchairAccessible: true,
  },
  // ── Italy ──────────────────────────────────────────────────────────────────
  {
    name: 'Arcigay Milano',
    description: 'Largest LGBTQ+ organisation branch in Italy, Milan.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [9.2082, 45.4745] },
    wheelchairAccessible: true,
  },
  {
    name: 'Arcigay Roma',
    description: 'Main LGBTQ+ community and advocacy centre in Rome.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [12.4774, 41.8772] },
    wheelchairAccessible: true,
  },
  {
    name: 'Arcigay Firenze',
    description: 'Active local LGBTQ+ centre in Florence.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [11.2464, 43.7767] },
    wheelchairAccessible: true,
  },
  // ── Malta ──────────────────────────────────────────────────────────────────
  {
    name: 'MGRM Malta',
    description: 'National LGBTQ+ rights organisation in Malta, Valletta.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [14.5126, 35.8992] },
    wheelchairAccessible: true,
  },
  // ── Cyprus ─────────────────────────────────────────────────────────────────
  {
    name: 'Accept LGBTI+ Cyprus',
    description: 'Main LGBTQ+ advocacy organisation in Cyprus, Nicosia.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [33.3663, 35.1701] },
    wheelchairAccessible: true,
  },
  // ── Czech Republic ─────────────────────────────────────────────────────────
  {
    name: 'Strana Praha',
    description: 'LGBTQ+ community space in Prague.',
    category: 'community',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [14.4489, 50.0762] },
    wheelchairAccessible: true,
  },
  // ── Slovenia ───────────────────────────────────────────────────────────────
  {
    name: 'Legebitra',
    description: 'Main LGBTQ+ organisation in Slovenia, Ljubljana.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [14.5163, 46.0569] },
    wheelchairAccessible: true,
  },
  // ── Croatia ────────────────────────────────────────────────────────────────
  {
    name: 'Iskorak',
    description: 'Main LGBTQ+ advocacy organisation in Croatia, Zagreb.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [15.9782, 45.814] },
    wheelchairAccessible: true,
  },
  // ── Estonia ────────────────────────────────────────────────────────────────
  {
    name: 'Estonian LGBT Association',
    description: 'Main LGBTQ+ organisation in Estonia, Tallinn.',
    category: 'support_group',
    safetyRating: 5,
    location: { type: 'Point', coordinates: [24.7279, 59.4469] },
    wheelchairAccessible: true,
  },
  // ── Latvia ─────────────────────────────────────────────────────────────────
  {
    name: 'Mozaīka',
    description: 'Main LGBTQ+ organisation in Latvia, Riga.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [24.1059, 56.9496] },
    wheelchairAccessible: true,
  },
  // ── Lithuania ──────────────────────────────────────────────────────────────
  {
    name: 'LGL (Lithuanian Gay League)',
    description: 'Main LGBTQ+ advocacy organisation in Lithuania, Vilnius.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [25.2797, 54.6872] },
    wheelchairAccessible: true,
  },
  // ── Poland ─────────────────────────────────────────────────────────────────
  {
    name: 'Lambda Warszawa',
    description: 'Main LGBTQ+ support organisation in Warsaw.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [21.0293, 52.2394] },
    wheelchairAccessible: true,
  },
  {
    name: 'Campaign Against Homophobia HQ',
    description: 'Key Polish LGBTQ+ advocacy organisation, Warsaw.',
    category: 'support_group',
    safetyRating: 4,
    location: { type: 'Point', coordinates: [21.0122, 52.2297] },
    wheelchairAccessible: true,
  },
  // ── Hungary ────────────────────────────────────────────────────────────────
  {
    name: 'Háttér Society',
    description: 'Main surviving LGBTQ+ support organisation in Budapest.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [19.0683, 47.5013] },
    wheelchairAccessible: true,
  },
  // ── Romania ────────────────────────────────────────────────────────────────
  {
    name: 'ACCEPT Romania',
    description: 'Main LGBTQ+ advocacy organisation in Romania, Bucharest.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [26.0997, 44.4649] },
    wheelchairAccessible: true,
  },
  // ── Bulgaria ───────────────────────────────────────────────────────────────
  {
    name: 'Bilitis Resource Centre',
    description: 'LGBTQ+ support organisation in Sofia.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [23.3317, 42.6682] },
    wheelchairAccessible: true,
  },
  // ── Serbia ─────────────────────────────────────────────────────────────────
  {
    name: 'Da Se Zna!',
    description:
      'Main LGBTQ+ documentation and advocacy organisation in Serbia, Belgrade.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [20.4612, 44.8176] },
    wheelchairAccessible: true,
  },
  // ── Albania ────────────────────────────────────────────────────────────────
  {
    name: 'Aleanca LGBT',
    description: 'Main LGBTQ+ advocacy organisation in Albania, Tirana.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [19.818, 41.3217] },
    wheelchairAccessible: true,
  },
  // ── Montenegro ─────────────────────────────────────────────────────────────
  {
    name: 'Queer Montenegro',
    description: 'Main LGBTQ+ advocacy organisation in Montenegro, Podgorica.',
    category: 'support_group',
    safetyRating: 2,
    location: { type: 'Point', coordinates: [19.2637, 42.4414] },
    wheelchairAccessible: false,
  },
  // ── Bosnia & Herzegovina ───────────────────────────────────────────────────
  {
    name: 'Sarajevo Open Centre',
    description:
      "LGBTQ+ and women's rights organisation in Sarajevo — operates under security concerns.",
    category: 'support_group',
    safetyRating: 2,
    location: { type: 'Point', coordinates: [18.4131, 43.8563] },
    wheelchairAccessible: false,
  },
  // ── Slovakia ───────────────────────────────────────────────────────────────
  {
    name: 'Iniciatíva Inakosť',
    description: 'Main LGBTQ+ advocacy organisation in Slovakia, Bratislava.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [17.1098, 48.1439] },
    wheelchairAccessible: true,
  },
  // ── North Macedonia ────────────────────────────────────────────────────────
  {
    name: 'Subversive Front',
    description: 'Main LGBTQ+ NGO in North Macedonia, Skopje.',
    category: 'support_group',
    safetyRating: 2,
    location: { type: 'Point', coordinates: [21.4324, 41.9965] },
    wheelchairAccessible: false,
  },
  // ── Kosovo ─────────────────────────────────────────────────────────────────
  {
    name: 'CEL Kosovo',
    description: 'LGBTQ+ advocacy NGO in Pristina — operates discreetly.',
    category: 'support_group',
    safetyRating: 2,
    location: { type: 'Point', coordinates: [21.1615, 42.6629] },
    wheelchairAccessible: false,
  },
  // ── Ukraine ────────────────────────────────────────────────────────────────
  {
    name: 'Nash Mir Centre',
    description:
      'Main LGBTQ+ organisation in Ukraine, Kyiv. Safety situation uncertain due to war.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [30.5197, 50.4662] },
    wheelchairAccessible: true,
  },
  // ── Moldova ────────────────────────────────────────────────────────────────
  {
    name: 'GENDERDOC-M',
    description: 'Main LGBTQ+ organisation in Moldova, Chișinău. Est. 1999.',
    category: 'support_group',
    safetyRating: 3,
    location: { type: 'Point', coordinates: [28.8353, 47.0219] },
    wheelchairAccessible: true,
  },
  // ── Armenia ────────────────────────────────────────────────────────────────
  {
    name: 'PINK Armenia',
    description:
      'LGBTQ+ organisation in Yerevan — operates discreetly under threats.',
    category: 'support_group',
    safetyRating: 2,
    location: { type: 'Point', coordinates: [44.5123, 40.1872] },
    wheelchairAccessible: false,
  },
  // ── Georgia ────────────────────────────────────────────────────────────────
  {
    name: 'Identoba',
    description:
      'LGBTQ+ rights organisation in Tbilisi — operates under severe threat.',
    category: 'support_group',
    safetyRating: 1,
    location: { type: 'Point', coordinates: [44.7896, 41.6938] },
    wheelchairAccessible: false,
  },
];
