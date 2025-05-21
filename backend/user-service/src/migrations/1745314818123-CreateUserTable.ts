import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1745314818123 implements MigrationInterface {
  name = 'CreateUserTable1745314818123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Створення таблиці користувачів
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2fb1f51b102d982d6375d20cd0a" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_4c95f9b29e5ef8d3d6b7c8f2fa6" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Видалення таблиці користувачів, якщо вона існує
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
