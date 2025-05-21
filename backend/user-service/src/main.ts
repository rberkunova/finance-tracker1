// backend/user-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ↙️ Додаємо трансформ та валідацію для всіх вхідних DTO
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,      // прибирає зайві поля з body/query
  }));

  const port = Number(process.env.PORT) || 8001;
  await app.listen(port);
  console.log(`🚀 User Service running on http://localhost:${port}`);
}
bootstrap();