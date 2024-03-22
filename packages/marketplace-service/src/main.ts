import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = configuration().api_port;
  await app.listen(PORT, () => {
    console.log(`Marketplace api is running on port ${PORT}`);
  });
}
bootstrap();
