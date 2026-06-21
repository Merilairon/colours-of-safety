import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBanAndSubmissionBan1718200000000 implements MigrationInterface {
  name = 'AddUserBanAndSubmissionBan1718200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "bannedAt" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "banReason" text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pois_banned"
      ON "pois" ("banned")
    `);

    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_districts_banned"
      ON "districts" ("banned")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "districts"
      DROP COLUMN IF EXISTS "banned"
    `);

    await queryRunner.query(`
      ALTER TABLE "pois"
      DROP COLUMN IF EXISTS "banned"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "banReason",
      DROP COLUMN IF EXISTS "bannedAt",
      DROP COLUMN IF EXISTS "banned"
    `);
  }
}
