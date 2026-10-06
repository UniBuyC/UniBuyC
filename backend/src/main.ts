import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Registro de peticiones que cambian datos o que fallan (las consultas periódicas no se muestran)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.method !== 'GET' || res.statusCode >= 400) {
        const size = req.headers['content-length'] ?? '-';
        console.log(
          `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms, ${size} bytes)`,
        );
      }
    });
    next();
  });

  // Fotos de productos subidas por los usuarios (GET /uploads/archivo.jpg)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
