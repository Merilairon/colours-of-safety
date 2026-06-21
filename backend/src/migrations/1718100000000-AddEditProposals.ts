import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditProposals1718100000000 implements MigrationInterface {
  name = 'AddEditProposals1718100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "edit_proposals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "targetType" character varying NOT NULL,
        "targetId" uuid NOT NULL,
        "originalData" jsonb NOT NULL DEFAULT '{}',
        "proposedData" jsonb NOT NULL DEFAULT '{}',
        "status" character varying NOT NULL DEFAULT 'pending',
        "reviewNote" text,
        "createdById" uuid NOT NULL,
        "reviewedById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_edit_proposals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_edit_proposals_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_edit_proposals_reviewed_by" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_edit_proposals_status" 
      ON "edit_proposals" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_edit_proposals_target" 
      ON "edit_proposals" ("targetType", "targetId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_edit_proposals_created_by" 
      ON "edit_proposals" ("createdById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "edit_proposals"`);
  }
}
