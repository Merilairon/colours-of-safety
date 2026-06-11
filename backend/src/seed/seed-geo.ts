/**
 * Standalone geo-data seed script.
 *
 * Usage:
 *   npm run seed:geo
 *
 * Environment variables (same as the main app):
 *   DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
 *   (falls back to the defaults in data-source.ts if not set)
 *
 * What it does:
 *   1. Inserts static known LGBTQ+ districts (10 cities).
 *   2. Inserts static curated Brussels POIs.
 *   3. Fetches LGBTQ+-tagged POIs from the Overpass API for 8 priority cities.
 *   4. Fetches named LGBTQ+ venues from Wikidata SPARQL.
 *
 * All records are inserted with status=approved so they appear on the public
 * map immediately. The script is idempotent — existing records (matched by
 * name) are skipped.
 */
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { GeoDataSeedService } from './geo-data-seed.service';

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const seeder = new GeoDataSeedService(AppDataSource);
  await seeder.run();

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Geo seed failed:', err);
  process.exit(1);
});
