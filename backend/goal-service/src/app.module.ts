import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessagingModule } from './rabbitmq/messaging.module';
import { GoalsModule } from './goals/goals.module';
import { Goal } from './goals/entities/goal.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Дуже добре! ConfigService буде доступний скрізь.
      envFilePath: '.env', // Правильно вказує на завантаження файлу .env
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Потрібно для inject: [ConfigService]
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:     'postgres',
        host:     cfg.get<string>('DB_HOST'),
        port:     cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_NAME'),
        entities: [Goal], // Правильно
        synchronize: cfg.get<string>('NODE_ENV') !== 'production',
        logging:     cfg.get<string>('NODE_ENV') !== 'production' ? ['error', 'warn', 'log'] : ['error'],
      }),
    }),

    MessagingModule,
    GoalsModule,
  ],
})
export class AppModule {}