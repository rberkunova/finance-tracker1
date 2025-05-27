// backend/goal-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Видаляє властивості, яких немає в DTO
    forbidNonWhitelisted: true, // Кидає помилку, якщо є зайві властивості
    transform: true, // Автоматично перетворює типи (наприклад, рядок в число для query params)
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Додамо глобальний префікс, якщо всі ендпоінти goal-service мають бути під /api
  // Якщо gateway вже додає /api, то тут це може бути не потрібно, або префікс має бути іншим.
  // Якщо контролер вже має @Controller('api/goals'), то глобальний префікс /api призведе до /api/api/goals
  // Тому, якщо префікс вже в контролері, тут його не ставимо.
  // app.setGlobalPrefix('api'); 

  const port = configService.get<number>('PORT_GOAL') || 3003;
  await app.listen(port);
  console.log(`🟢 Goal Service listening on http://localhost:${port}`);
}
bootstrap();