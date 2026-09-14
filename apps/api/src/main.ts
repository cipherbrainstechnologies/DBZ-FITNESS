import 'reflect-metadata';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';

import { AppModule } from './app.module.js';
import { corsOrigins, loadEnv } from './config/env.js';
import { runRuntimeDatabaseBootstrap } from './database/runtime-bootstrap.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  runRuntimeDatabaseBootstrap();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  app.enableCors({
    origin: corsOrigins(env),
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Request-Id',
      'Idempotency-Key',
    ],
  });

  app.use(cookieParser());

  const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../public');
  app.use('/static', express.static(publicDir, { index: false, maxAge: '7d' }));

  await app.listen(env.PORT, '0.0.0.0');
  Logger.log(`API listening on ${env.API_URL} (port ${env.PORT})`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
