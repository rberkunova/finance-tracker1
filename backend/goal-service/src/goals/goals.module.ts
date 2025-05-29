// backend/goal-service/src/goals/goals.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // Для HTTP запитів
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { Goal } from './entities/goal.entity';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Додайте ConfigModule, якщо ще не глобальний

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal]),
    HttpModule, // Дозволяє інжектувати HttpService
    ConfigModule, // Потрібен для ConfigService, якщо він не глобальний
    // Якщо RabbitMQ налаштовується тут: RabbitMQModule.forRootAsync(...)
  ],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    // ConfigService, // NestJS автоматично надасть ConfigService, якщо ConfigModule імпортовано
    // AmqpConnection, // Якщо не надається глобально модулем RabbitMQ
  ],
})
export class GoalsModule {}