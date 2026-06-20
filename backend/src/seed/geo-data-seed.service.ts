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
  StaticDistrict,
} from './geo-seed.data';

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
];

/** Wikidata class QIDs to query → maps to app category. */
const WIKIDATA_CLASSES: Array<{
  qid: string;
  category: string;
  label: string;
}> = [
  { qid: 'Q1412694', category: 'bar', label: 'gay bar' },
  { qid: 'Q1628398', category: 'community', label: 'LGBTQ community center' },
  {
    qid: 'Q1076486',
    category: 'sexual_health_clinic',
    label: 'sexual health clinic',
  },
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
export class GeoDataSeedService {
  private readonly logger = new Logger(GeoDataSeedService.name);
  private poiRepo: Repository<Poi>;
  private districtRepo: Repository<District>;
  private userRepo: Repository<User>;
  private seederId: string;

  constructor(private readonly dataSource: DataSource) {
    this.poiRepo = dataSource.getRepository(Poi);
    this.districtRepo = dataSource.getRepository(District);
    this.userRepo = dataSource.getRepository(User);
  }

  async run(): Promise<void> {
    this.logger.log('Starting geo data seed…');

    this.seederId = await this.ensureSeederAccount();

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
    let inserted = 0;
    for (const d of KNOWN_DISTRICTS) {
      const exists = await this.districtRepo.findOne({
        where: { name: d.name },
      });
      if (exists) continue;
      await this.insertDistrict(d);
      inserted++;
    }
    this.logger.log(
      `Static districts: ${inserted} inserted (${KNOWN_DISTRICTS.length - inserted} already present).`,
    );
  }

  private async seedStaticPois(): Promise<void> {
    let inserted = 0;
    for (const p of KNOWN_POIS) {
      if (await this.poiNameExists(p.name)) continue;
      await this.insertPoi(
        p.name,
        p.description,
        p.category,
        p.safetyRating,
        p.location,
        p.wheelchairAccessible,
      );
      inserted++;
    }
    this.logger.log(
      `Static POIs: ${inserted} inserted (${KNOWN_POIS.length - inserted} already present).`,
    );
  }

  // ---------------------------------------------------------------------------
  // Overpass API
  // ---------------------------------------------------------------------------

  private async seedOverpassPois(): Promise<void> {
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const city of CITY_BBOXES) {
      const query = this.buildOverpassQuery(city.bbox);
      this.logger.log(`Querying Overpass for ${city.name}…`);

      let elements: OverpassElement[];
      try {
        elements = await this.fetchOverpass(query);
      } catch (err) {
        this.logger.warn(
          `Overpass query failed for ${city.name}: ${(err as Error).message}`,
        );
        continue;
      }

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
        if (await this.poiNameExists(name)) {
          totalSkipped++;
          continue;
        }

        await this.insertPoi(
          name,
          description,
          category,
          safetyRating,
          { type: 'Point', coordinates: coords },
          wheelchair,
        );
        totalInserted++;
      }

      this.logger.log(
        `  ${city.name}: ${elements.length} elements fetched, inserted so far: ${totalInserted}`,
      );
      await this.sleep(1500); // polite delay between city requests
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
    return `[out:json][timeout:60];
(
  node["lgbtq"~"primary|welcome|yes|only"](${bbox});
  way["lgbtq"~"primary|welcome|yes|only"](${bbox});
  node["lgbtq:venue"~"primary|welcome|yes|only"](${bbox});
);
out center body;`;
  }

  private async fetchOverpass(query: string): Promise<OverpassElement[]> {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'ColoursOfSafety/1.0 (https://coloursofsafety.com; geodata-seed)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { elements: OverpassElement[] };
    return json.elements ?? [];
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

    for (const cls of WIKIDATA_CLASSES) {
      this.logger.log(`Querying Wikidata for class ${cls.qid} (${cls.label})…`);

      let bindings: WikidataBinding[];
      try {
        bindings = await this.fetchWikidata(cls.qid);
      } catch (err) {
        this.logger.warn(
          `Wikidata query failed for ${cls.qid}: ${(err as Error).message}`,
        );
        continue;
      }

      for (const b of bindings) {
        const name = b.itemLabel?.value;
        if (!name) continue;

        const coords = this.parseWktPoint(b.coord?.value);
        if (!coords) continue;
        if (await this.poiNameExists(name)) {
          totalSkipped++;
          continue;
        }

        await this.insertPoi(
          name,
          `Sourced from Wikidata: ${b.item.value}`,
          cls.category,
          4,
          { type: 'Point', coordinates: coords },
          false,
        );
        totalInserted++;
      }

      this.logger.log(
        `  ${cls.label}: ${bindings.length} results, inserted so far: ${totalInserted}`,
      );
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

  private async insertDistrict(d: StaticDistrict): Promise<void> {
    const district = this.districtRepo.create({
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
    });
    await this.districtRepo.save(district);
  }

  private async insertPoi(
    name: string,
    description: string,
    category: string,
    safetyRating: number,
    location: { type: 'Point'; coordinates: [number, number] },
    wheelchairAccessible: boolean,
  ): Promise<void> {
    const poi = this.poiRepo.create({
      name,
      description,
      category,
      safetyRating,
      location: location as Point,
      wheelchairAccessible,
      status: ReviewStatus.APPROVED,
      isAnonymous: false,
      voteCount: 0,
      reviewNote: null,
      createdById: this.seederId,
      reviewedById: this.seederId,
    });
    await this.poiRepo.save(poi);
  }

  private async poiNameExists(name: string): Promise<boolean> {
    const count = await this.poiRepo.count({ where: { name } });
    return count > 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
