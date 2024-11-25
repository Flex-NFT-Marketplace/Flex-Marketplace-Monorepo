import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';
import { AppClusterService } from './app-cluster.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configuration().offchain_worker_port, () => {
    console.log(
      `offchain worker is running on port ${configuration().offchain_worker_port}`,
    );
  });
}
bootstrap();
// AppClusterService.clusterize(bootstrap)
