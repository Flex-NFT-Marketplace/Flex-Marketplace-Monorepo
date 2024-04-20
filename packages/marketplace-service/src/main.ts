import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

import { configureValidation, configureSwagger } from '@app/shared/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSwagger(app);
  configureValidation(app);
  app.enableCors();
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const PORT = configuration().api_port;

  await app.listen(PORT, () => {
    console.log(`Marketplace api is running on port ${PORT}`);
  });
}
bootstrap();
