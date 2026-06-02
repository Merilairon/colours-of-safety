import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPronouns1717420000000 implements MigrationInterface {
  name = 'AddUserPronouns1717420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_pronouns_enum" AS ENUM(
          'they/them', 'she/her', 'he/him', 'ze/zir', 'prefer not to say', 'custom'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "pronouns" "public"."users_pronouns_enum" DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "pronouns";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."users_pronouns_enum";
    `);
  }
}
