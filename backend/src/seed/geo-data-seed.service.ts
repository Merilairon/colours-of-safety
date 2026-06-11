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
  { name: 'Brussels', bbox: [50.75, 4.25, 50.95, 4.5] },
  { name: 'Amsterdam', bbox: [52.33, 4.75, 52.43, 5.03] },
  { name: 'Berlin', bbox: [52.46, 13.3, 52.55, 13.47] },
  { name: 'Paris', bbox: [48.83, 2.28, 48.89, 2.4] },
  { name: 'London', bbox: [51.48, -0.2, 51.54, 0.0] },
  { name: 'Madrid', bbox: [40.4, -3.73, 40.45, -3.66] },
  { name: 'Barcelona', bbox: [41.36, 2.14, 41.42, 2.22] },
  { name: 'Manchester', bbox: [53.46, -2.27, 53.5, -2.18] },
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
