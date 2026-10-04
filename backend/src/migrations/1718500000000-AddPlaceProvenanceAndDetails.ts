import { MigrationInterface, QueryRunner } from 'typeorm';

const SEEDER_EMAIL = 'geodata-seeder@coloursofsafety.internal';
const WIKIDATA_NOTE =
  'Unpublished by the 2026-10 seed re-audit: imported from an unrelated Wikidata class (art museums, not LGBTQIA+ venues).';
const DUPLICATE_NOTE =
  'Unpublished by the 2026-10 seed re-audit: duplicate of ';

/**
 * LSA-B12 / LSA-F13 / LSA-F2: record where each place came from and when a
 * person last confirmed it, add contact details, and clean up the seed.
 *
 * Every Wikidata import so far came from wrong class IDs; the only one that
 * matched anything was Q207694 ("art museum"), so they are unpublished
 * (status → rejected, reversible in `down`). Imported duplicates of an
 * older entry within 100 m are unpublished the same way.
 */
export class AddPlaceProvenanceAndDetails1718500000000 implements MigrationInterface {
  name = 'AddPlaceProvenanceAndDetails1718500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['pois', 'districts']) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN IF NOT EXISTS "source" varchar(20) NOT NULL DEFAULT 'community',
        ADD COLUMN IF NOT EXISTS "sourceUrl" varchar(500) NULL,
        ADD COLUMN IF NOT EXISTS "lastVerifiedAt" timestamptz NULL
      `);
    }
    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD COLUMN IF NOT EXISTS "address" varchar(300) NULL,
      ADD COLUMN IF NOT EXISTS "website" varchar(500) NULL,
      ADD COLUMN IF NOT EXISTS "openingHours" varchar(300) NULL,
      ADD COLUMN IF NOT EXISTS "ratingCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "communityRating" real NULL
    `);

    const seeder = `(SELECT "id" FROM "users" WHERE "email" = '${SEEDER_EMAIL}')`;

    // Wikidata rows kept their item URL in the description.
    await queryRunner.query(
      `
      UPDATE "pois"
      SET "source" = 'wikidata',
          "sourceUrl" = substring("description" from 'https?://\\S+'),
          "description" = '',
          "status" = 'rejected',
          "reviewNote" = $1
      WHERE "createdById" = ${seeder}
        AND "description" LIKE 'Sourced from Wikidata:%'
    `,
      [WIKIDATA_NOTE],
    );
    // The rest of the seeded places came from OpenStreetMap or the curated
    // list, but which one was never stored.
    await queryRunner.query(`
      UPDATE "pois" SET "source" = 'imported'
      WHERE "createdById" = ${seeder} AND "source" = 'community'
    `);
    await queryRunner.query(`
      UPDATE "districts" SET "source" = 'curated'
      WHERE "createdById" = ${seeder} AND "source" = 'community'
    `);

    // Community entries were confirmed when a reviewer approved them; the
    // approval time was not stored, so the last update is the best estimate.
    for (const table of ['pois', 'districts']) {
      await queryRunner.query(`
        UPDATE "${table}" SET "lastVerifiedAt" = "updatedAt"
        WHERE "source" = 'community' AND "status" = 'approved'
      `);
    }

    // Imported duplicates: same name (case/space-insensitive) within 100 m of
    // an older published entry. The oldest entry wins.
    await queryRunner.query(
      `
      UPDATE "pois" AS dup
      SET "status" = 'rejected',
          "reviewNote" = $1 || keep."id"
      FROM "pois" AS keep
      WHERE dup."source" <> 'community'
        AND dup."status" = 'approved'
        AND keep."status" = 'approved'
        AND keep."id" <> dup."id"
        AND lower(trim(keep."name")) = lower(trim(dup."name"))
        AND (keep."createdAt", keep."id") < (dup."createdAt", dup."id")
        AND ST_DWithin(keep."location"::geography, dup."location"::geography, 100)
    `,
      [DUPLICATE_NOTE],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Republish what the re-audit unpublished, then drop the new columns.
    await queryRunner.query(
      `
      UPDATE "pois" SET "status" = 'approved', "reviewNote" = NULL
      WHERE "reviewNote" = $1 OR "reviewNote" LIKE $2
    `,
      [WIKIDATA_NOTE, `${DUPLICATE_NOTE}%`],
    );
    await queryRunner.query(`
      UPDATE "pois" SET "description" = 'Sourced from Wikidata: ' || "sourceUrl"
      WHERE "source" = 'wikidata' AND "sourceUrl" IS NOT NULL AND "description" = ''
    `);
    await queryRunner.query(`
      ALTER TABLE "pois"
      DROP COLUMN IF EXISTS "communityRating",
      DROP COLUMN IF EXISTS "ratingCount",
      DROP COLUMN IF EXISTS "openingHours",
      DROP COLUMN IF EXISTS "website",
      DROP COLUMN IF EXISTS "address"
    `);
    for (const table of ['pois', 'districts']) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        DROP COLUMN IF EXISTS "lastVerifiedAt",
        DROP COLUMN IF EXISTS "sourceUrl",
        DROP COLUMN IF EXISTS "source"
      `);
    }
  }
}
