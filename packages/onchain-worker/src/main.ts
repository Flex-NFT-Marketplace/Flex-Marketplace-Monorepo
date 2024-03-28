import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(config().onchain_worker_port, () => {
    console.log(
      `onchain worker is running on port ${config().onchain_worker_port}`,
    );
  });
}
bootstrap();
