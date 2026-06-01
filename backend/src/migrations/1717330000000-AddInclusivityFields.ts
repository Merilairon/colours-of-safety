import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInclusivityFields1717330000000 implements MigrationInterface {
  name = 'AddInclusivityFields1717330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add wheelchairAccessible column to pois table
    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD COLUMN IF NOT EXISTS "wheelchairAccessible" boolean NOT NULL DEFAULT false;
    `);

    // Add isAnonymous column to pois table
    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD COLUMN IF NOT EXISTS "isAnonymous" boolean NOT NULL DEFAULT false;
    `);

    // Add wheelchairAccessible column to districts table
    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD COLUMN IF NOT EXISTS "wheelchairAccessible" boolean NOT NULL DEFAULT false;
    `);

    // Add isAnonymous column to districts table
    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD COLUMN IF NOT EXISTS "isAnonymous" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from pois table
    await queryRunner.query(`
      ALTER TABLE "pois"
      DROP COLUMN IF EXISTS "wheelchairAccessible";
    `);
    await queryRunner.query(`
      ALTER TABLE "pois"
      DROP COLUMN IF EXISTS "isAnonymous";
    `);

    // Remove columns from districts table
    await queryRunner.query(`
      ALTER TABLE "districts"
      DROP COLUMN IF EXISTS "wheelchairAccessible";
    `);
    await queryRunner.query(`
      ALTER TABLE "districts"
      DROP COLUMN IF EXISTS "isAnonymous";
    `);
  }
}
