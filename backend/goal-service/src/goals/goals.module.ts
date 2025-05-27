import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Goal } from './entities/goal.entity';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';

@Module({
  imports: [
    // Репозиторій для роботи з цілями
    TypeOrmModule.forFeature([Goal]),
    // ⬇️ RabbitMQModule більше не імпортуємо тут,
    // бо він уже ініціалізується в кореневому AppModule
  ],
  providers: [GoalsService],
  controllers: [GoalsController],
  exports: [GoalsService],
})
export class GoalsModule {}
