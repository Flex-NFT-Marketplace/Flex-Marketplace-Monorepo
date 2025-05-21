import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configuration().coin_price_port, () => {
    console.log(
      `coin price service is running on port ${configuration().coin_price_port}`,
    );
  });
}
bootstrap();
// AppClusterService.clusterize(bootstrap)
