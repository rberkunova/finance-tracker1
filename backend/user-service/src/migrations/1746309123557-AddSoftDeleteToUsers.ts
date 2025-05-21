import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsers1746309123557 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
