import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

// gateway/src/main.ts   (виправити)
app.use(
  '/api/users',
  createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: (path) => '/api/users' + path, 
  }),
);

app.use(
  '/api/transactions',
  createProxyMiddleware({
    target: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:8002',
    changeOrigin: true,
    pathRewrite: (path) => '/transactions' + path, 
  }),
);

  const port = Number(process.env.PORT) || 8000;
  await app.listen(port);
  console.log(`🚀  Gateway running on http://localhost:${port}`);
}

bootstrap();