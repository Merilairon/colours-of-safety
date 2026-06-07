import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDistrictBlendEdges1717590000000 implements MigrationInterface {
  name = 'AddDistrictBlendEdges1717590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD COLUMN IF NOT EXISTS "blendEdges" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "districts"
      DROP COLUMN IF EXISTS "blendEdges";
    `);
  }
}
