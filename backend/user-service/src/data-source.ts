import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'postgres',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'DBPASSOWD1',
  database: process.env.DB_NAME ?? 'pfm_db',

  entities: [User],

  // лише .js — що вже згенеровано під час `nest build`
  migrations: ['src/migrations/**/*{.ts,.js}'],

  synchronize: false,
  migrationsRun: false      // <-- вимикаємо! міграції запускаєте CLI
});
