import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessagingModule } from './rabbitmq/messaging.module';    // <-- новий імпорт
import { TransactionsModule } from './transactions/transactions.module';
import { Transaction } from './transactions/transaction.entity';

@Module({
  imports: [
    /* глобальна конфігурація */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /* БД */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:     'postgres',
        host:     cfg.get<string>('DB_HOST'),
        port:     cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_NAME'),
        entities: [Transaction],
        synchronize: cfg.get<string>('NODE_ENV') !== 'production',
        logging:     cfg.get<string>('NODE_ENV') !== 'production' ? ['error', 'warn'] : ['error'],
      }),
    }),

    /* RabbitMQ (глобальний) */
    MessagingModule,

    /* бізнес-логіка сервісу транзакцій */
    TransactionsModule,
  ],
})
export class AppModule {}
