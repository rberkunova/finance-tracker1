import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Transaction } from './transaction.entity';
import { TransactionsService } from './transaction.service';
import { TransactionsController } from './transaction.controller';

@Module({
  imports: [
    /* репозиторій */
    TypeOrmModule.forFeature([Transaction]),
    /* RabbitMQModule імпортувати більше не треба — він глобальний завдяки MessagingModule */
  ],
  controllers: [TransactionsController],
  providers:   [TransactionsService],
})
export class TransactionsModule {}
