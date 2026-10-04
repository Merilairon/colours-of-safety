import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetAndHashTokens1718400000000 implements MigrationInterface {
  name = 'AddPasswordResetAndHashTokens1718400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar NULL,
      ADD COLUMN IF NOT EXISTS "passwordResetExpires" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "passwordChangedAt" timestamptz NULL
    `);
    // Tokens are now stored as SHA-256 hashes. Existing plaintext tokens were
    // never emailed (only logged, and exposed via the public API), so they are
    // invalidated rather than migrated. Users can request a fresh email.
    await queryRunner.query(`
      UPDATE "users"
      SET "emailVerificationToken" = NULL,
          "emailVerificationExpires" = NULL,
          "emailChangeToken" = NULL,
          "emailChangeExpires" = NULL,
          "pendingEmail" = NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "passwordChangedAt",
      DROP COLUMN IF EXISTS "passwordResetExpires",
      DROP COLUMN IF EXISTS "passwordResetToken"
    `);
  }
}
