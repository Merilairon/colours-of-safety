/**
 * Where a place or district came from. Anything other than `COMMUNITY` was
 * bulk-imported by the geo seeder and shows as "Imported — not yet
 * community-verified" until a person confirms it (LSA-B12, LSA-F13).
 */
export enum PlaceSource {
  COMMUNITY = 'community',
  OPENSTREETMAP = 'openstreetmap',
  WIKIDATA = 'wikidata',
  /** Hand-picked list in `seed/geo-seed.data.ts`. */
  CURATED = 'curated',
  /** Seeded before sources were recorded; origin unknown. */
  IMPORTED = 'imported',
}
