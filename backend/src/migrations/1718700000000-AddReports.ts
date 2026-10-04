import { MigrationInterface, QueryRunner } from 'typeorm';

/** LSA-F4: in-app reports that feed the moderator queue. */
export class AddReports1718700000000 implements MigrationInterface {
  name = 'AddReports1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "targetType" varchar(20) NOT NULL,
        "targetId" uuid NOT NULL,
        "reason" varchar(30) NOT NULL,
        "details" text NOT NULL DEFAULT '',
        "reporterId" uuid NULL,
        "status" varchar(20) NOT NULL DEFAULT 'open',
        "resolvedById" uuid NULL,
        "resolutionNote" text NULL,
        "resolvedAt" timestamptz NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporterId")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reports_resolved_by" FOREIGN KEY ("resolvedById")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reports_status_created" ON "reports" ("status", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
  }
}
