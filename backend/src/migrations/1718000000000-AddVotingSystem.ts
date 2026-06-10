import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVotingSystem1718000000000 implements MigrationInterface {
  name = 'AddVotingSystem1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add voteCount to pois
    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD COLUMN IF NOT EXISTS "voteCount" integer NOT NULL DEFAULT 0
    `);

    // Add voteCount to districts
    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD COLUMN IF NOT EXISTS "voteCount" integer NOT NULL DEFAULT 0
    `);

    // Create votes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "targetId" uuid NOT NULL,
        "targetType" character varying NOT NULL,
        "userId" uuid,
        "ipHash" character varying NOT NULL,
        "value" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_votes" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_votes_targetId_targetType" 
      ON "votes" ("targetId", "targetType")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_votes_target_user" 
      ON "votes" ("targetId", "targetType", "userId")
      WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_votes_target_ip" 
      ON "votes" ("targetId", "targetType", "ipHash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "votes"`);
    await queryRunner.query(`
      ALTER TABLE "pois" DROP COLUMN IF EXISTS "voteCount"
    `);
    await queryRunner.query(`
      ALTER TABLE "districts" DROP COLUMN IF EXISTS "voteCount"
    `);
  }
}
