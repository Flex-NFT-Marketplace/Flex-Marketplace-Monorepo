// should be use to validate request body and parse to dto

import { INestApplication, ValidationPipe } from '@nestjs/common';

// if not use this, request body will be parsed to plain object
export function configureValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}
