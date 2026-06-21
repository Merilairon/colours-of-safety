import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFields1718300000000 implements MigrationInterface {
  name = 'AddProfileFields1718300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "avatar" varchar NULL,
      ADD COLUMN IF NOT EXISTS "bio" text NULL,
      ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb NOT NULL DEFAULT '{"emailUpdates":true}',
      ADD COLUMN IF NOT EXISTS "pendingEmail" varchar NULL,
      ADD COLUMN IF NOT EXISTS "emailChangeToken" varchar NULL,
      ADD COLUMN IF NOT EXISTS "emailChangeExpires" timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "emailChangeExpires",
      DROP COLUMN IF EXISTS "emailChangeToken",
      DROP COLUMN IF EXISTS "pendingEmail",
      DROP COLUMN IF EXISTS "notificationPreferences",
      DROP COLUMN IF EXISTS "bio",
      DROP COLUMN IF EXISTS "avatar"
    `);
  }
}
