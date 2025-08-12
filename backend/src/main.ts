import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { CORS } from './constants';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const certPath = './cert';
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(certPath, 'private.key')),
    cert: fs.readFileSync(path.resolve(certPath, 'certificate.crt')),
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  // const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(
    '/api/credit-transactions/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
  app.enableCors(CORS);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  app.use(morgan('dev'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  console.log('running on port ', process.env.PORT);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
