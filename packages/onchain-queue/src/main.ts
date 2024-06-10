import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configuration().onchain_queue_port, () => {
    console.log(
      `onchain queue is running on port ${configuration().onchain_queue_port}`,
    );
  });
}
bootstrap();
