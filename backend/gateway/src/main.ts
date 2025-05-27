import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createProxyMiddleware,
  Options as ProxyOptions,
} from 'http-proxy-middleware';
import { AppModule } from './app.module';
import morgan from 'morgan';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import * as http from 'http';

type PathRewrite = (path: string, req: http.IncomingMessage) => string;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  const log = new Logger('Gateway');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: cfg.get('FRONTEND_URL') ?? 'http://localhost:5173',
    credentials: true,
  });

  app.use(morgan('dev'));

  /* -------- URLs мікросервісів -------- */
  const userServiceUrl =
    cfg.get('USER_SERVICE_URL') ?? 'http://localhost:8001';    // ← виправлено
  const transactionServiceUrl =
    cfg.get('TRANSACTION_SERVICE_URL') ?? 'http://localhost:8002';
  const goalServiceUrl =
    cfg.get('GOAL_SERVICE_URL') ?? 'http://localhost:3003';

  log.log(`USER_SERVICE_URL resolved to: ${userServiceUrl}`);
  log.log(`TRANSACTION_SERVICE_URL resolved to: ${transactionServiceUrl}`);
  log.log(`GOAL_SERVICE_URL resolved to: ${goalServiceUrl}`);

  /* -------- фабрика опцій проксі -------- */
  const proxyOpts = (
    target: string,
    pathRewrite?: PathRewrite,
  ): ProxyOptions => ({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq(proxyReq, req) {
        const r = req as ExpressRequest;
        log.log(`GW ⇒ ${target}${proxyReq.path} (${r.method} ${r.originalUrl})`);
        if (r.body && r.method !== 'GET' && r.method !== 'HEAD') {
          const data = JSON.stringify(r.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(data));
          proxyReq.write(data);
        }
      },
      proxyRes(proxyRes, req) {
        const r = req as ExpressRequest;
        const p = (proxyRes as any).req?.path ?? '';
        log.log(`Target ⇒ GW: ${proxyRes.statusCode} ${target}${p} (orig ${r.originalUrl})`);
      },
      error(err, req, res) {
        const r = req as ExpressRequest;
        const s = res as ExpressResponse;
        log.error(`PROXY ERROR ${r.method} ${r.originalUrl} → ${target} : ${err.message}`);
        if (!s.headersSent) {
          s.status(502).json({ message: 'Proxy error', error: err.message });
        }
      },
    },
  });

  /* -------- маршрути -------- */

  // 1) User-service
  //    /api/users/**  →  target /api/users/**
  app.use(
    '/api/users',
    createProxyMiddleware(
      proxyOpts(userServiceUrl, (path) => `/api/users${path}`), // ← додаємо префікс назад
    ),
  );

  // 2) Transaction-service
  app.use(
    '/api/transactions',
    createProxyMiddleware(
      proxyOpts(transactionServiceUrl, (path) => `/transactions${path}`),
    ),
  );

  // 3) Goal-service
  app.use(
    '/api/goals',
    createProxyMiddleware(
      proxyOpts(goalServiceUrl, (path) => `/api/goals${path}`),
    ),
  );

  /* -------- старт -------- */
  const port = cfg.get('PORT_GATEWAY') ?? 8000;
  await app.listen(port);
  log.log(`🚀 Gateway running on http://localhost:${port}`);
}
bootstrap();
