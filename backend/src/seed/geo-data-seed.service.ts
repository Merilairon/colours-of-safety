import { Logger } from '@nestjs/common';
import type { Point } from 'geojson';
import { DataSource, Repository } from 'typeorm';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { ReviewStatus } from '../common/review-status.enum';
import { User, UserRole } from '../users/user.entity';
import {
  KNOWN_DISTRICTS,
  KNOWN_POIS,
  OSM_LGBTQ_SAFETY,
  osmTagsToCategory,
} from './geo-seed.data';

interface PoiInsertRow {
  name: string;
  description: string;
  category: string;
  safetyRating: number;
  location: Point;
  wheelchairAccessible: boolean;
}

// Mirrors: https://overpass-api.de/api/interpreter (2 slots)
//          https://overpass.kumi.systems/api/interpreter (rate limit 0 = unlimited)
//          https://maps.mail.ru/osm/tools/overpass/api/interpreter (varies)
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql';

/** Bounding boxes [south, west, north, east] for priority cities. */
const CITY_BBOXES: Array<{
  name: string;
  bbox: [number, number, number, number];
}> = [
  // ── Belgium ──────────────────────────────────────────────────────────────
  { name: 'Brussels', bbox: [50.75, 4.25, 50.95, 4.5] },
  { name: 'Antwerp', bbox: [51.19, 4.36, 51.25, 4.45] },
  { name: 'Ghent', bbox: [51.03, 3.69, 51.08, 3.76] },
  // ── Netherlands ──────────────────────────────────────────────────────────
  { name: 'Amsterdam', bbox: [52.33, 4.75, 52.43, 5.03] },
  { name: 'Rotterdam', bbox: [51.89, 4.43, 51.95, 4.54] },
  // ── Germany ──────────────────────────────────────────────────────────────
  { name: 'Berlin', bbox: [52.46, 13.3, 52.55, 13.47] },
  { name: 'Munich', bbox: [48.11, 11.52, 48.17, 11.63] },
  { name: 'Hamburg', bbox: [53.52, 9.95, 53.6, 10.07] },
  { name: 'Cologne', bbox: [50.91, 6.92, 50.97, 7.02] },
  { name: 'Frankfurt', bbox: [50.09, 8.63, 50.14, 8.73] },
  // ── France ───────────────────────────────────────────────────────────────
  { name: 'Paris', bbox: [48.83, 2.28, 48.89, 2.4] },
  { name: 'Lyon', bbox: [45.73, 4.8, 45.79, 4.86] },
  { name: 'Montpellier', bbox: [43.59, 3.85, 43.63, 3.91] },
  { name: 'Bordeaux', bbox: [44.82, -0.61, 44.87, -0.54] },
  { name: 'Toulouse', bbox: [43.58, 1.42, 43.62, 1.48] },
  // ── United Kingdom ───────────────────────────────────────────────────────
  { name: 'London', bbox: [51.48, -0.2, 51.54, 0.0] },
  { name: 'Manchester', bbox: [53.46, -2.27, 53.5, -2.18] },
  // ── Spain ────────────────────────────────────────────────────────────────
  { name: 'Madrid', bbox: [40.4, -3.73, 40.45, -3.66] },
  { name: 'Barcelona', bbox: [41.36, 2.14, 41.42, 2.22] },
  { name: 'Sitges', bbox: [41.22, 1.8, 41.25, 1.83] },
  { name: 'Seville', bbox: [37.37, -6.02, 37.41, -5.97] },
  { name: 'Torremolinos', bbox: [36.61, -4.52, 36.64, -4.48] },
  { name: 'Maspalomas', bbox: [27.73, -15.61, 27.77, -15.55] },
  // ── Portugal ─────────────────────────────────────────────────────────────
  { name: 'Lisbon', bbox: [38.7, -9.17, 38.74, -9.12] },
  { name: 'Porto', bbox: [41.13, -8.66, 41.17, -8.58] },
  // ── Italy ────────────────────────────────────────────────────────────────
  { name: 'Milan', bbox: [45.44, 9.16, 45.5, 9.24] },
  { name: 'Rome', bbox: [41.87, 12.45, 41.92, 12.52] },
  { name: 'Bologna', bbox: [44.48, 11.32, 44.52, 11.38] },
  { name: 'Florence', bbox: [43.76, 11.22, 43.8, 11.28] },
  // ── Greece ───────────────────────────────────────────────────────────────
  { name: 'Athens', bbox: [37.96, 23.69, 38.0, 23.76] },
  { name: 'Mykonos', bbox: [37.43, 25.31, 37.46, 25.35] },
  // ── Malta ────────────────────────────────────────────────────────────────
  { name: 'Valletta', bbox: [35.89, 14.49, 35.91, 14.52] },
  { name: 'St Julians', bbox: [35.91, 14.48, 35.93, 14.51] },
  // ── Switzerland ──────────────────────────────────────────────────────────
  { name: 'Zurich', bbox: [47.36, 8.52, 47.4, 8.57] },
  { name: 'Geneva', bbox: [46.19, 6.12, 46.23, 6.17] },
  // ── Austria ──────────────────────────────────────────────────────────────
  { name: 'Vienna', bbox: [48.18, 16.33, 48.23, 16.4] },
  // ── Luxembourg ───────────────────────────────────────────────────────────
  { name: 'Luxembourg City', bbox: [49.59, 6.1, 49.63, 6.16] },
  // ── Sweden ───────────────────────────────────────────────────────────────
  { name: 'Stockholm', bbox: [59.3, 18.01, 59.36, 18.12] },
  { name: 'Gothenburg', bbox: [57.68, 11.93, 57.73, 12.01] },
  { name: 'Malmo', bbox: [55.57, 12.97, 55.61, 13.03] },
  // ── Norway ───────────────────────────────────────────────────────────────
  { name: 'Oslo', bbox: [59.9, 10.71, 59.95, 10.79] },
  // ── Denmark ──────────────────────────────────────────────────────────────
  { name: 'Copenhagen', bbox: [55.66, 12.52, 55.7, 12.6] },
  // ── Finland ──────────────────────────────────────────────────────────────
  { name: 'Helsinki', bbox: [60.15, 24.88, 60.2, 24.98] },
  // ── Iceland ──────────────────────────────────────────────────────────────
  { name: 'Reykjavik', bbox: [64.13, -22.03, 64.16, -21.88] },
  // ── Ireland ──────────────────────────────────────────────────────────────
  { name: 'Dublin', bbox: [53.32, -6.29, 53.36, -6.22] },
  // ── Czech Republic ───────────────────────────────────────────────────────
  { name: 'Prague', bbox: [50.06, 14.4, 50.1, 14.5] },
  { name: 'Brno', bbox: [49.18, 16.58, 49.22, 16.64] },
  // ── Slovenia ─────────────────────────────────────────────────────────────
  { name: 'Ljubljana', bbox: [46.04, 14.49, 46.07, 14.54] },
  // ── Croatia ──────────────────────────────────────────────────────────────
  { name: 'Zagreb', bbox: [45.8, 15.95, 45.84, 16.01] },
  // ── Estonia ──────────────────────────────────────────────────────────────
  { name: 'Tallinn', bbox: [59.42, 24.69, 59.47, 24.79] },
  // ── Latvia ───────────────────────────────────────────────────────────────
  { name: 'Riga', bbox: [56.93, 24.07, 56.97, 24.14] },
  // ── Lithuania ────────────────────────────────────────────────────────────
  { name: 'Vilnius', bbox: [54.67, 25.25, 54.71, 25.32] },
  // ── Poland ───────────────────────────────────────────────────────────────
  { name: 'Warsaw', bbox: [52.2, 20.96, 52.27, 21.07] },
  { name: 'Krakow', bbox: [50.04, 19.91, 50.08, 19.98] },
  { name: 'Wroclaw', bbox: [51.09, 16.98, 51.13, 17.06] },
  // ── Hungary ──────────────────────────────────────────────────────────────
  { name: 'Budapest', bbox: [47.47, 18.99, 47.53, 19.1] },
  // ── Romania ──────────────────────────────────────────────────────────────
  { name: 'Bucharest', bbox: [44.41, 26.05, 44.5, 26.16] },
  { name: 'Cluj-Napoca', bbox: [46.75, 23.55, 46.8, 23.63] },
  // ── Serbia ───────────────────────────────────────────────────────────────
  { name: 'Belgrade', bbox: [44.79, 20.41, 44.84, 20.52] },
  // ── Bulgaria ─────────────────────────────────────────────────────────────
  { name: 'Sofia', bbox: [42.65, 23.28, 42.71, 23.38] },
  // ── Albania ──────────────────────────────────────────────────────────────
  { name: 'Tirana', bbox: [41.31, 19.79, 41.35, 19.84] },
  // ── Netherlands (additional) ─────────────────────────────────────────────
  { name: 'Eindhoven', bbox: [51.42, 5.44, 51.47, 5.52] },
  // ── Belgium (additional) ─────────────────────────────────────────────────
  { name: 'Liege', bbox: [50.63, 5.55, 50.66, 5.6] },
  // ── Switzerland (additional) ─────────────────────────────────────────────
  { name: 'Bern', bbox: [46.93, 7.42, 46.96, 7.47] },
  // ── Austria (additional) ─────────────────────────────────────────────────
  { name: 'Graz', bbox: [47.05, 15.42, 47.09, 15.47] },
  // ── Sweden (additional) ──────────────────────────────────────────────────
  { name: 'Lund', bbox: [55.7, 13.17, 55.73, 13.22] },
  // ── Norway (additional) ──────────────────────────────────────────────────
  { name: 'Bergen', bbox: [60.37, 5.3, 60.41, 5.37] },
  // ── Denmark (additional) ─────────────────────────────────────────────────
  { name: 'Aarhus', bbox: [56.14, 10.18, 56.18, 10.24] },
  // ── Finland (additional) ─────────────────────────────────────────────────
  { name: 'Tampere', bbox: [61.48, 23.73, 61.52, 23.8] },
  // ── Ireland (additional) ─────────────────────────────────────────────────
  { name: 'Cork', bbox: [51.88, -8.52, 51.92, -8.44] },
  { name: 'Galway', bbox: [53.26, -9.07, 53.28, -9.03] },
  // ── Spain (additional) ───────────────────────────────────────────────────
  { name: 'Benidorm', bbox: [38.53, -0.14, 38.56, -0.1] },
  // ── Portugal (additional) ────────────────────────────────────────────────
  { name: 'Faro', bbox: [37.01, -7.94, 37.03, -7.92] },
  // ── Italy (additional) ───────────────────────────────────────────────────
  { name: 'Naples', bbox: [40.83, 14.22, 40.87, 14.28] },
  // ── Greece (additional) ──────────────────────────────────────────────────
  { name: 'Thessaloniki', bbox: [40.62, 22.93, 40.66, 22.98] },
  { name: 'Lesvos', bbox: [39.09, 26.52, 39.13, 26.57] },
  // ── Cyprus ───────────────────────────────────────────────────────────────
  { name: 'Limassol', bbox: [34.67, 33.02, 34.7, 33.07] },
  { name: 'Nicosia', bbox: [35.16, 33.35, 35.19, 33.39] },
  // ── Malta (additional) ───────────────────────────────────────────────────
  { name: 'Sliema', bbox: [35.9, 14.5, 35.92, 14.51] },
  // ── Slovenia (additional) ────────────────────────────────────────────────
  { name: 'Maribor', bbox: [46.54, 15.63, 46.57, 15.67] },
  // ── Croatia (additional) ─────────────────────────────────────────────────
  { name: 'Hvar', bbox: [43.17, 16.44, 43.19, 16.47] },
  { name: 'Dubrovnik', bbox: [42.63, 18.1, 42.66, 18.13] },
  { name: 'Split', bbox: [43.5, 16.42, 43.53, 16.46] },
  // ── Estonia (additional) ─────────────────────────────────────────────────
  { name: 'Tartu', bbox: [58.37, 26.71, 58.4, 26.76] },
  // ── Lithuania (additional) ───────────────────────────────────────────────
  { name: 'Kaunas', bbox: [54.89, 23.9, 54.92, 23.95] },
  // ── Slovakia ─────────────────────────────────────────────────────────────
  { name: 'Bratislava', bbox: [48.14, 17.1, 48.17, 17.15] },
  // ── Montenegro ───────────────────────────────────────────────────────────
  { name: 'Budva', bbox: [42.27, 18.83, 42.3, 18.86] },
  { name: 'Podgorica', bbox: [42.43, 19.25, 42.46, 19.28] },
  // ── Bosnia & Herzegovina ─────────────────────────────────────────────────
  { name: 'Sarajevo', bbox: [43.84, 18.39, 43.87, 18.44] },
  // ── North Macedonia ──────────────────────────────────────────────────────
  { name: 'Skopje', bbox: [41.99, 21.42, 42.02, 21.47] },
  // ── Kosovo ───────────────────────────────────────────────────────────────
  { name: 'Pristina', bbox: [42.65, 21.15, 42.68, 21.19] },
  // ── Ukraine ──────────────────────────────────────────────────────────────
  { name: 'Kyiv', bbox: [50.43, 30.49, 50.48, 30.56] },
  // ── Moldova ──────────────────────────────────────────────────────────────
  { name: 'Chisinau', bbox: [46.99, 28.83, 47.04, 28.88] },
  // ── Georgia ──────────────────────────────────────────────────────────────
  { name: 'Tbilisi', bbox: [41.69, 44.77, 41.73, 44.82] },
  // ── Armenia ──────────────────────────────────────────────────────────────
  { name: 'Yerevan', bbox: [40.17, 44.49, 40.21, 44.54] },
  // ── Belarus ──────────────────────────────────────────────────────────────
  { name: 'Minsk', bbox: [53.88, 27.54, 53.93, 27.61] },

  // ── North America — United States ────────────────────────────────────────
  { name: 'New York City', bbox: [40.7, -74.02, 40.78, -73.95] },
  { name: 'San Francisco', bbox: [37.75, -122.44, 37.8, -122.38] },
  { name: 'Los Angeles', bbox: [34.07, -118.38, 34.12, -118.31] },
  { name: 'Chicago', bbox: [41.88, -87.68, 41.93, -87.62] },
  { name: 'Miami', bbox: [25.77, -80.22, 25.82, -80.17] },
  { name: 'Washington DC', bbox: [38.89, -77.05, 38.94, -77.0] },
  { name: 'Seattle', bbox: [47.6, -122.35, 47.65, -122.29] },
  { name: 'Atlanta', bbox: [33.74, -84.41, 33.79, -84.35] },
  { name: 'New Orleans', bbox: [29.94, -90.08, 29.98, -90.03] },
  { name: 'Portland OR', bbox: [45.51, -122.68, 45.55, -122.63] },
  { name: 'Austin TX', bbox: [30.25, -97.77, 30.29, -97.72] },
  { name: 'Minneapolis', bbox: [44.96, -93.3, 45.0, -93.24] },
  { name: 'Denver', bbox: [39.72, -104.99, 39.76, -104.94] },
  { name: 'Boston', bbox: [42.34, -71.1, 42.38, -71.05] },
  { name: 'Las Vegas', bbox: [36.1, -115.18, 36.16, -115.13] },
  { name: 'Philadelphia', bbox: [39.94, -75.18, 39.98, -75.13] },
  { name: 'Dallas', bbox: [32.77, -96.82, 32.81, -96.77] },
  { name: 'Houston', bbox: [29.74, -95.41, 29.78, -95.36] },
  { name: 'Phoenix', bbox: [33.44, -112.08, 33.48, -112.03] },
  { name: 'San Diego', bbox: [32.71, -117.17, 32.75, -117.12] },
  { name: 'Nashville', bbox: [36.15, -86.8, 36.19, -86.75] },
  { name: 'Salt Lake City', bbox: [40.75, -111.92, 40.79, -111.87] },
  { name: 'Columbus OH', bbox: [39.95, -83.01, 39.99, -82.96] },
  { name: 'Detroit', bbox: [42.32, -83.06, 42.36, -83.01] },
  { name: 'Baltimore', bbox: [39.28, -76.63, 39.32, -76.58] },
  { name: 'Fort Lauderdale', bbox: [26.11, -80.15, 26.15, -80.1] },
  { name: 'Provincetown MA', bbox: [42.04, -70.2, 42.07, -70.17] },
  { name: 'Palm Springs CA', bbox: [33.82, -116.56, 33.85, -116.52] },
  { name: 'Asheville NC', bbox: [35.56, -82.57, 35.6, -82.53] },
  { name: 'Pittsburgh', bbox: [40.43, -80.02, 40.47, -79.97] },
  { name: 'Kansas City', bbox: [39.09, -94.6, 39.13, -94.55] },
  { name: 'Louisville KY', bbox: [38.24, -85.77, 38.28, -85.72] },
  { name: 'Richmond VA', bbox: [37.53, -77.47, 37.57, -77.42] },
  // ── North America — Canada ───────────────────────────────────────────────
  { name: 'Toronto', bbox: [43.64, -79.42, 43.68, -79.36] },
  { name: 'Montreal', bbox: [45.51, -73.59, 45.55, -73.54] },
  { name: 'Vancouver', bbox: [49.27, -123.14, 49.31, -123.09] },
  { name: 'Calgary', bbox: [51.03, -114.1, 51.07, -114.04] },
  { name: 'Ottawa', bbox: [45.41, -75.72, 45.44, -75.68] },
  { name: 'Edmonton', bbox: [53.53, -113.52, 53.57, -113.47] },
  { name: 'Winnipeg', bbox: [49.88, -97.16, 49.92, -97.11] },
  { name: 'Halifax', bbox: [44.64, -63.6, 44.67, -63.56] },
  { name: 'Victoria BC', bbox: [48.42, -123.38, 48.45, -123.34] },
  { name: 'Quebec City', bbox: [46.8, -71.23, 46.83, -71.19] },
  // ── North America — Mexico & Central America ─────────────────────────────
  { name: 'Mexico City', bbox: [19.41, -99.19, 19.46, -99.13] },
  { name: 'Guadalajara', bbox: [20.66, -103.38, 20.7, -103.33] },
  { name: 'Puerto Vallarta', bbox: [20.61, -105.25, 20.64, -105.22] },
  { name: 'Monterrey', bbox: [25.66, -100.33, 25.7, -100.28] },
  { name: 'Cancun', bbox: [21.15, -86.86, 21.19, -86.82] },
  { name: 'Oaxaca', bbox: [17.06, -96.73, 17.09, -96.69] },
  { name: 'San José CR', bbox: [9.93, -84.09, 9.96, -84.05] },
  { name: 'Panama City', bbox: [8.99, -79.53, 9.02, -79.49] },

  // ── Caribbean ────────────────────────────────────────────────────────────
  { name: 'San Juan PR', bbox: [18.46, -66.12, 18.49, -66.08] },
  { name: 'Havana', bbox: [23.12, -82.39, 23.16, -82.34] },
  { name: 'Kingston Jamaica', bbox: [17.99, -76.81, 18.02, -76.77] },

  // ── South America ────────────────────────────────────────────────────────
  { name: 'São Paulo', bbox: [-23.57, -46.67, -23.53, -46.63] },
  { name: 'Rio de Janeiro', bbox: [-22.98, -43.21, -22.93, -43.16] },
  { name: 'Buenos Aires', bbox: [-34.62, -58.44, -34.58, -58.38] },
  { name: 'Bogota', bbox: [4.58, -74.12, 4.63, -74.07] },
  { name: 'Santiago', bbox: [-33.47, -70.67, -33.43, -70.62] },
  { name: 'Lima', bbox: [-12.08, -77.06, -12.04, -77.01] },
  { name: 'Montevideo', bbox: [-34.92, -56.2, -34.88, -56.15] },
  { name: 'Medellin', bbox: [6.22, -75.59, 6.27, -75.54] },
  { name: 'Belo Horizonte', bbox: [-19.93, -43.95, -19.89, -43.9] },
  { name: 'Porto Alegre', bbox: [-30.04, -51.24, -30.0, -51.19] },
  { name: 'Florianopolis', bbox: [-27.6, -48.56, -27.56, -48.52] },
  { name: 'Curitiba', bbox: [-25.44, -49.3, -25.4, -49.25] },
  { name: 'Recife', bbox: [-8.07, -34.92, -8.03, -34.87] },
  { name: 'Cartagena', bbox: [10.39, -75.53, 10.43, -75.49] },
  { name: 'Quito', bbox: [-0.23, -78.53, -0.19, -78.48] },
  { name: 'Asuncion', bbox: [-25.3, -57.65, -25.26, -57.6] },
  { name: 'La Paz', bbox: [-16.52, -68.16, -16.48, -68.11] },
  { name: 'Caracas', bbox: [10.48, -66.92, 10.52, -66.87] },

  // ── Africa ───────────────────────────────────────────────────────────────
  { name: 'Cape Town', bbox: [-33.94, 18.41, -33.9, 18.46] },
  { name: 'Johannesburg', bbox: [-26.22, 28.01, -26.17, 28.07] },
  { name: 'Nairobi', bbox: [-1.3, 36.81, -1.26, 36.86] },
  { name: 'Lagos', bbox: [6.44, 3.37, 6.49, 3.42] },
  { name: 'Accra', bbox: [5.54, -0.22, 5.58, -0.17] },
  { name: 'Dar es Salaam', bbox: [-6.82, 39.27, -6.78, 39.32] },
  { name: 'Durban', bbox: [-29.87, 31.01, -29.83, 31.06] },
  { name: 'Pretoria', bbox: [-25.75, 28.18, -25.71, 28.23] },
  { name: 'Kampala', bbox: [0.31, 32.57, 0.35, 32.62] },
  { name: 'Addis Ababa', bbox: [8.98, 38.74, 9.02, 38.79] },
  { name: 'Dakar', bbox: [14.68, -17.47, 14.72, -17.42] },
  { name: 'Abidjan', bbox: [5.34, -4.03, 5.38, -3.98] },
  { name: 'Lusaka', bbox: [-15.43, 28.28, -15.39, 28.33] },
  { name: 'Harare', bbox: [-17.84, 31.03, -17.8, 31.08] },
  { name: 'Kigali', bbox: [-1.96, 30.05, -1.92, 30.1] },
  { name: 'Maputo', bbox: [-25.98, 32.57, -25.94, 32.62] },
  { name: 'Windhoek', bbox: [-22.57, 17.07, -22.53, 17.12] },
  { name: 'Gaborone', bbox: [-24.67, 25.9, -24.63, 25.95] },
  { name: 'Mombasa', bbox: [-4.06, 39.65, -4.02, 39.7] },

  // ── Middle East / North Africa ───────────────────────────────────────────
  { name: 'Tel Aviv', bbox: [32.06, 34.76, 32.1, 34.81] },
  { name: 'Beirut', bbox: [33.87, 35.48, 33.9, 35.53] },
  { name: 'Istanbul', bbox: [41.01, 28.96, 41.05, 29.02] },
  { name: 'Tunis', bbox: [36.8, 10.16, 36.84, 10.21] },
  { name: 'Casablanca', bbox: [33.57, -7.64, 33.61, -7.59] },
  { name: 'Amman', bbox: [31.95, 35.91, 31.99, 35.95] },

  // ── Central Asia ─────────────────────────────────────────────────────────
  { name: 'Almaty', bbox: [43.22, 76.87, 43.26, 76.93] },

  // ── South Asia ───────────────────────────────────────────────────────────
  { name: 'Mumbai', bbox: [18.95, 72.82, 18.99, 72.87] },
  { name: 'Delhi', bbox: [28.62, 77.2, 28.67, 77.26] },
  { name: 'Bangalore', bbox: [12.96, 77.58, 13.01, 77.64] },
  { name: 'Kolkata', bbox: [22.55, 88.34, 22.59, 88.39] },
  { name: 'Colombo', bbox: [6.9, 79.84, 6.94, 79.89] },
  { name: 'Kathmandu', bbox: [27.69, 85.3, 27.73, 85.35] },

  // ── Southeast Asia ───────────────────────────────────────────────────────
  { name: 'Bangkok', bbox: [13.73, 100.52, 13.77, 100.57] },
  { name: 'Phuket', bbox: [7.87, 98.37, 7.91, 98.42] },
  { name: 'Chiang Mai', bbox: [18.78, 98.98, 18.82, 99.03] },
  { name: 'Singapore', bbox: [1.28, 103.83, 1.32, 103.88] },
  { name: 'Kuala Lumpur', bbox: [3.13, 101.68, 3.17, 101.73] },
  { name: 'Ho Chi Minh City', bbox: [10.76, 106.68, 10.8, 106.73] },
  { name: 'Hanoi', bbox: [21.01, 105.82, 21.05, 105.87] },
  { name: 'Manila', bbox: [14.58, 120.97, 14.62, 121.02] },
  { name: 'Bali Denpasar', bbox: [-8.67, 115.2, -8.63, 115.25] },
  { name: 'Jakarta', bbox: [-6.23, 106.8, -6.19, 106.85] },

  // ── East Asia ────────────────────────────────────────────────────────────
  { name: 'Tokyo', bbox: [35.67, 139.7, 35.72, 139.76] },
  { name: 'Osaka', bbox: [34.67, 135.49, 34.71, 135.54] },
  { name: 'Taipei', bbox: [25.03, 121.51, 25.07, 121.56] },
  { name: 'Seoul', bbox: [37.52, 126.98, 37.56, 127.03] },
  { name: 'Hong Kong', bbox: [22.27, 114.15, 22.31, 114.2] },
  { name: 'Beijing', bbox: [39.9, 116.38, 39.95, 116.44] },
  { name: 'Shanghai', bbox: [31.22, 121.47, 31.26, 121.52] },

  // ── Oceania ──────────────────────────────────────────────────────────────
  { name: 'Sydney', bbox: [-33.89, 151.19, -33.85, 151.24] },
  { name: 'Melbourne', bbox: [-37.83, 144.95, -37.79, 145.0] },
  { name: 'Brisbane', bbox: [-27.49, 153.01, -27.45, 153.06] },
  { name: 'Perth', bbox: [-31.96, 115.85, -31.92, 115.9] },
  { name: 'Adelaide', bbox: [-34.93, 138.59, -34.89, 138.64] },
  { name: 'Canberra', bbox: [-35.32, 149.12, -35.28, 149.17] },
  { name: 'Gold Coast', bbox: [-28.02, 153.4, -27.98, 153.45] },
  { name: 'Newcastle AU', bbox: [-32.93, 151.76, -32.89, 151.81] },
  { name: 'Hobart', bbox: [-42.89, 147.32, -42.85, 147.37] },
  { name: 'Auckland', bbox: [-36.88, 174.74, -36.84, 174.79] },
  { name: 'Wellington', bbox: [-41.3, 174.77, -41.27, 174.81] },
  { name: 'Christchurch', bbox: [-43.54, 172.62, -43.5, 172.67] },
  { name: 'Hamilton NZ', bbox: [-37.79, 175.27, -37.75, 175.32] },
  { name: 'Suva', bbox: [-18.16, 178.42, -18.12, 178.47] },
  { name: 'Port Moresby', bbox: [-9.46, 147.17, -9.42, 147.22] },
];

/** Wikidata class QIDs to query → maps to app category. */
const WIKIDATA_CLASSES: Array<{
  qid: string;
  category: string;
  label: string;
}> = [
  // Bars & nightlife
  { qid: 'Q1412694', category: 'bar', label: 'gay bar' },
  { qid: 'Q1378312', category: 'club', label: 'gay nightclub' },
  { qid: 'Q56076827', category: 'bar', label: 'lesbian bar' },
  { qid: 'Q117253659', category: 'club', label: 'LGBTQ nightclub' },
  // Community & organisations
  { qid: 'Q1628398', category: 'community', label: 'LGBTQ community center' },
  {
    qid: 'Q15249553',
    category: 'support_group',
    label: 'LGBTQ rights organisation',
  },
  { qid: 'Q15249558', category: 'support_group', label: 'LGBT organisation' },
  {
    qid: 'Q97498871',
    category: 'support_group',
    label: 'transgender organisation',
  },
  // Health
  {
    qid: 'Q1076486',
    category: 'sexual_health_clinic',
    label: 'sexual health clinic',
  },
  {
    qid: 'Q1060791',
    category: 'hiv_sti_testing',
    label: 'HIV/AIDS service organisation',
  },
  // Culture & memorials
  { qid: 'Q20671774', category: 'community', label: 'LGBTQ memorial' },
  { qid: 'Q207694', category: 'community', label: 'LGBTQ museum' },
  { qid: 'Q1191680', category: 'community', label: 'gay sauna' },
  // Accommodation
  { qid: 'Q1146519', category: 'community', label: 'gay-friendly hotel' },
  // Books & media
  { qid: 'Q2735359', category: 'community', label: 'LGBT bookshop' },
  // Pride events (as venues/routes)
  { qid: 'Q83371', category: 'community', label: 'pride parade' },
];

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface WikidataBinding {
  item: { value: string };
  itemLabel: { value: string };
  coord: { value: string };
}

/**
 * Fetches LGBTQ+ POIs from the Overpass API for each configured city bounding
 * box and from Wikidata SPARQL, then bulk-inserts them (+ known static
 * districts and POIs) into the database with status=approved.
 *
 * Designed to be run once before production launch via `npm run seed:geo`.
 * Idempotent: skips records whose name+location already exists.
 */
/** Max concurrent Overpass requests — Overpass API enforces 2 slots per IP. */
const OVERPASS_CONCURRENCY = 2;
/** Max concurrent Wikidata requests. */
const WIKIDATA_CONCURRENCY = 4;
/** Rows per bulk insert batch. */
const INSERT_BATCH_SIZE = 100;

export class GeoDataSeedService {
  private readonly logger = new Logger(GeoDataSeedService.name);
  private poiRepo: Repository<Poi>;
  private districtRepo: Repository<District>;
  private userRepo: Repository<User>;
  private seederId: string;
  /** In-memory set of existing POI names — avoids per-row DB reads. */
  private existingPoiNames = new Set<string>();

  constructor(private readonly dataSource: DataSource) {
    this.poiRepo = dataSource.getRepository(Poi);
    this.districtRepo = dataSource.getRepository(District);
    this.userRepo = dataSource.getRepository(User);
  }

  async run(): Promise<void> {
    this.logger.log('Starting geo data seed…');

    this.seederId = await this.ensureSeederAccount();

    // Load all existing POI names once — O(1) lookups during seeding.
    const existing = await this.poiRepo.find({ select: ['name'] });
    this.existingPoiNames = new Set(existing.map((p) => p.name));
    this.logger.log(
      `Loaded ${this.existingPoiNames.size} existing POI names into cache.`,
    );

    await this.seedStaticDistricts();
    await this.seedStaticPois();
    await this.seedOverpassPois();
    await this.seedWikidataPois();

    this.logger.log('Geo data seed complete.');
  }

  // ---------------------------------------------------------------------------
  // Seeder account
  // ---------------------------------------------------------------------------

  private async ensureSeederAccount(): Promise<string> {
    const email = 'geodata-seeder@coloursofsafety.internal';
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({
        email,
        displayName: 'GeoData Seeder',
        passwordHash: 'NOT_A_REAL_HASH',
        role: UserRole.REVIEWER,
      });
      await this.userRepo.save(user);
      this.logger.log(`Created seeder account: ${email}`);
    }
    return user.id;
  }

  // ---------------------------------------------------------------------------
  // Static data
  // ---------------------------------------------------------------------------

  private async seedStaticDistricts(): Promise<void> {
    const existing = await this.districtRepo.find({ select: ['name'] });
    const existingNames = new Set(existing.map((d) => d.name));

    const toInsert = KNOWN_DISTRICTS.filter((d) => !existingNames.has(d.name));
    for (const batch of this.chunk(toInsert, INSERT_BATCH_SIZE)) {
      const entities = batch.map((d) =>
        this.districtRepo.create({
          name: d.name,
          description: d.description,
          safetyRating: d.safetyRating,
          blendEdges: d.blendEdges,
          area: d.area,
          status: ReviewStatus.APPROVED,
          isAnonymous: false,
          wheelchairAccessible: false,
          voteCount: 0,
          reviewNote: null,
          createdById: this.seederId,
          reviewedById: this.seederId,
        }),
      );
      await this.districtRepo.save(entities);
    }
    this.logger.log(
      `Static districts: ${toInsert.length} inserted (${existingNames.size} already present).`,
    );
  }

  private async seedStaticPois(): Promise<void> {
    const toInsert = KNOWN_POIS.filter(
      (p) => !this.existingPoiNames.has(p.name),
    );
    await this.bulkInsertPois(
      toInsert.map((p) => ({
        name: p.name,
        description: p.description,
        category: p.category,
        safetyRating: p.safetyRating,
        location: p.location,
        wheelchairAccessible: p.wheelchairAccessible,
      })),
    );
    this.logger.log(
      `Static POIs: ${toInsert.length} inserted (${KNOWN_POIS.length - toInsert.length} already present).`,
    );
  }

  // ---------------------------------------------------------------------------
  // Overpass API
  // ---------------------------------------------------------------------------

  private async seedOverpassPois(): Promise<void> {
    let totalInserted = 0;
    let totalSkipped = 0;

    // Process cities in concurrent batches.
    for (const batch of this.chunk(CITY_BBOXES, OVERPASS_CONCURRENCY)) {
      const results = await Promise.allSettled(
        batch.map(async (city) => {
          const query = this.buildOverpassQuery(city.bbox);
          const elements = await this.fetchOverpass(query);
          return { city: city.name, elements };
        }),
      );

      const poisToInsert: Parameters<typeof this.bulkInsertPois>[0] = [];

      for (const result of results) {
        if (result.status === 'rejected') {
          const err = result.reason as Error;
          this.logger.warn(
            `Overpass batch query failed: ${this.describeError(err)}`,
          );
          continue;
        }
        const { city, elements } = result.value;
        let cityInserted = 0;

        for (const el of elements) {
          const tags = el.tags ?? {};
          const lgbtqTag = tags['lgbtq'] ?? tags['lgbtq:venue'] ?? '';
          const safetyRating = OSM_LGBTQ_SAFETY[lgbtqTag] ?? 3;
          const category = osmTagsToCategory(tags);
          const name = tags['name'] ?? tags['name:en'] ?? `OSM node ${el.id}`;
          const description = tags['description'] ?? tags['note'] ?? '';
          const wheelchair = tags['wheelchair'] === 'yes';
          const coords = this.extractCoords(el);

          if (!coords) continue;
          if (this.existingPoiNames.has(name)) {
            totalSkipped++;
            continue;
          }

          // Mark in cache immediately to avoid duplicates within this batch.
          this.existingPoiNames.add(name);
          poisToInsert.push({
            name,
            description,
            category,
            safetyRating,
            location: { type: 'Point', coordinates: coords },
            wheelchairAccessible: wheelchair,
          });
          cityInserted++;
        }

        this.logger.log(
          `  ${city}: ${elements.length} elements, ${cityInserted} queued for insert`,
        );
      }

      const inserted = await this.bulkInsertPois(poisToInsert);
      totalInserted += inserted;

      // Brief pause between batches — polite to Overpass.
      await this.sleep(2000);
    }

    this.logger.log(
      `Overpass seed complete: ${totalInserted} inserted, ${totalSkipped} skipped.`,
    );
  }

  private buildOverpassQuery([south, west, north, east]: [
    number,
    number,
    number,
    number,
  ]): string {
    const bbox = `${south},${west},${north},${east}`;
    return `[out:json][timeout:30];
(
  node["lgbtq"~"primary|welcome|yes|only"](${bbox});
  way["lgbtq"~"primary|welcome|yes|only"](${bbox});
  node["lgbtq:venue"~"primary|welcome|yes|only"](${bbox});
);
out center body;`;
  }

  private async fetchOverpass(
    query: string,
    retries = 5,
  ): Promise<OverpassElement[]> {
    let delay = 10_000;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'ColoursOfSafety/1.0 (https://coloursofsafety.com; geodata-seed)',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (res.status === 429 || res.status === 503 || res.status === 504) {
        if (attempt === retries)
          throw new Error(`HTTP ${res.status} after ${retries} attempts`);
        this.logger.warn(
          `Overpass rate-limited (HTTP ${res.status}), retrying in ${delay / 1000}s (attempt ${attempt}/${retries})…`,
        );
        await this.sleep(delay);
        delay *= 2;
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { elements: OverpassElement[] };
      return json.elements ?? [];
    }
    throw new Error('fetchOverpass: exhausted retries');
  }

  private extractCoords(el: OverpassElement): [number, number] | null {
    if (el.lat !== undefined && el.lon !== undefined) return [el.lon, el.lat];
    if (el.center) return [el.center.lon, el.center.lat];
    return null;
  }

  // ---------------------------------------------------------------------------
  // Wikidata SPARQL
  // ---------------------------------------------------------------------------

  private async seedWikidataPois(): Promise<void> {
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const batch of this.chunk(WIKIDATA_CLASSES, WIKIDATA_CONCURRENCY)) {
      const results = await Promise.allSettled(
        batch.map((cls) =>
          this.fetchWikidata(cls.qid).then((bindings) => ({
            cls,
            bindings,
          })),
        ),
      );

      const poisToInsert: PoiInsertRow[] = [];

      for (const result of results) {
        if (result.status === 'rejected') {
          this.logger.warn(
            `Wikidata batch query failed: ${String(result.reason)}`,
          );
          continue;
        }
        const { cls, bindings } = result.value;
        let clsInserted = 0;

        for (const b of bindings) {
          const name = b.itemLabel?.value;
          if (!name) continue;
          const coords = this.parseWktPoint(b.coord?.value);
          if (!coords) continue;
          if (this.existingPoiNames.has(name)) {
            totalSkipped++;
            continue;
          }
          this.existingPoiNames.add(name);
          poisToInsert.push({
            name,
            description: `Sourced from Wikidata: ${b.item.value}`,
            category: cls.category,
            safetyRating: 4,
            location: { type: 'Point', coordinates: coords },
            wheelchairAccessible: false,
          });
          clsInserted++;
        }

        this.logger.log(
          `  ${cls.label}: ${bindings.length} results, ${clsInserted} queued`,
        );
      }

      const inserted = await this.bulkInsertPois(poisToInsert);
      totalInserted += inserted;
      await this.sleep(1000);
    }

    this.logger.log(
      `Wikidata seed complete: ${totalInserted} inserted, ${totalSkipped} skipped.`,
    );
  }

  private async fetchWikidata(classQid: string): Promise<WikidataBinding[]> {
    const sparql = `
      SELECT ?item ?itemLabel ?coord WHERE {
        ?item wdt:P31 wd:${classQid}.
        ?item wdt:P625 ?coord.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,nl,de". }
      }
      LIMIT 500
    `;
    const url = `${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(sparql)}&format=json`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent':
          'ColoursOfSafety/1.0 (https://coloursofsafety.com; geodata-seed)',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      results: { bindings: WikidataBinding[] };
    };
    return json.results?.bindings ?? [];
  }

  /** Parses WKT Point("lng lat") → [lng, lat]. */
  private parseWktPoint(wkt: string | undefined): [number, number] | null {
    if (!wkt) return null;
    const match = wkt.match(/Point\(([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\)/i);
    if (!match) return null;
    return [parseFloat(match[1]), parseFloat(match[2])];
  }

  // ---------------------------------------------------------------------------
  // DB helpers
  // ---------------------------------------------------------------------------

  /**
   * Bulk-inserts POI rows in batches and returns the count inserted.
   * Skips rows whose name is already in existingPoiNames.
   */
  private async bulkInsertPois(rows: PoiInsertRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    let inserted = 0;
    for (const batch of this.chunk(rows, INSERT_BATCH_SIZE)) {
      const entities = batch.map((r) =>
        this.poiRepo.create({
          name: r.name,
          description: r.description,
          category: r.category,
          safetyRating: r.safetyRating,
          location: r.location,
          wheelchairAccessible: r.wheelchairAccessible,
          status: ReviewStatus.APPROVED,
          isAnonymous: false,
          voteCount: 0,
          reviewNote: null,
          createdById: this.seederId,
          reviewedById: this.seederId,
        }),
      );
      await this.poiRepo.save(entities);
      inserted += entities.length;
    }
    return inserted;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private describeError(err: unknown, depth = 0): string {
    if (depth > 4 || !err) return String(err);
    if (err instanceof AggregateError && err.errors?.length) {
      return `${err.message} [${err.errors.map((e: unknown) => this.describeError(e, depth + 1)).join(' | ')}]`;
    }
    if (err instanceof Error) {
      const causeStr = (err as NodeJS.ErrnoException).cause
        ? ` → ${this.describeError((err as NodeJS.ErrnoException).cause, depth + 1)}`
        : '';
      const code = (err as NodeJS.ErrnoException).code
        ? ` [${(err as NodeJS.ErrnoException).code}]`
        : '';
      return `${err.message}${code}${causeStr}`;
    }
    return JSON.stringify(err);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
