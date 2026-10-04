import { MigrationInterface, QueryRunner } from 'typeorm';

/** LSA-F5: community ratings and short reviews on places. */
export class AddPlaceRatings1718600000000 implements MigrationInterface {
  name = 'AddPlaceRatings1718600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "poiId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text NOT NULL DEFAULT '',
        "isAnonymous" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_place_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_place_ratings_poi_author" UNIQUE ("poiId", "authorId"),
        CONSTRAINT "CHK_place_ratings_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "FK_place_ratings_poi" FOREIGN KEY ("poiId")
          REFERENCES "pois"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_place_ratings_author" FOREIGN KEY ("authorId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_place_ratings_poi" ON "place_ratings" ("poiId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "place_ratings"`);
  }
}
