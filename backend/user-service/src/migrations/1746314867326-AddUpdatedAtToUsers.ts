import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToUsers1745314818123 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP DEFAULT now()`
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "users" DROP COLUMN "updated_at"`
    );
  }
}
