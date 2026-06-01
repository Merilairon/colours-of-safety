import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1717242000000 implements MigrationInterface {
  name = 'InitialMigration1717242000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM ('user', 'reviewer', 'admin', 'super_admin');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      );
    `);

    // Create review status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
          CREATE TYPE "public"."review_status_enum" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END$$;
    `);

    // Create pois table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pois" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "category" character varying NOT NULL DEFAULT 'other',
        "safetyRating" integer NOT NULL DEFAULT 3,
        "location" geometry(Point, 4326) NOT NULL,
        "status" "public"."review_status_enum" NOT NULL DEFAULT 'pending',
        "reviewNote" text,
        "createdById" uuid NOT NULL,
        "reviewedById" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_01c2c4c0d13a37e9046a5f735f7" PRIMARY KEY ("id")
      );
    `);

    // Create spatial index for pois
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_location" ON "pois" USING GIST ("location");
    `);

    // Create districts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "districts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "safetyRating" integer NOT NULL DEFAULT 3,
        "area" geometry(Polygon, 4326) NOT NULL,
        "status" "public"."review_status_enum" NOT NULL DEFAULT 'pending',
        "reviewNote" text,
        "createdById" uuid NOT NULL,
        "reviewedById" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_872c1167e5b042eb73bffbc6f2a" PRIMARY KEY ("id")
      );
    `);

    // Create spatial index for districts
    await queryRunner.query(`
      CREATE INDEX "IDX_districts_area" ON "districts" USING GIST ("area");
    `);

    // Create foreign keys for pois
    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD CONSTRAINT "FK_pois_createdBy"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "pois"
      ADD CONSTRAINT "FK_pois_reviewedBy"
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL;
    `);

    // Create foreign keys for districts
    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD CONSTRAINT "FK_districts_createdBy"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "districts"
      ADD CONSTRAINT "FK_districts_reviewedBy"
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL;
    `);

    // Create indexes for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_status" ON "pois"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pois_createdById" ON "pois"("createdById");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_districts_status" ON "districts"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_districts_createdById" ON "districts"("createdById");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "pois" DROP CONSTRAINT "FK_pois_reviewedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pois" DROP CONSTRAINT "FK_pois_createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" DROP CONSTRAINT "FK_districts_reviewedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" DROP CONSTRAINT "FK_districts_createdBy"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "districts"`);
    await queryRunner.query(`DROP TABLE "pois"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."review_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
