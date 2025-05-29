import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'postgres',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'DBPASSOWD1',
        database: process.env.DB_NAME ?? 'pfm_db',

        entities: [__dirname + '/**/*.entity{.js,.ts}'],
        migrations: [__dirname + '/migrations/**/*.js'],

        synchronize: true,
        migrationsRun: false  // <-- вимкнено
      }),
    }),

    UsersModule,
  ],
})
export class AppModule {}
