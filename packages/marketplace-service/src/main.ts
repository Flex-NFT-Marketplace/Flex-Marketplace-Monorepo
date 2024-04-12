import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

function configureSwagger(app: INestApplication) {
  const swaggerDocOptions = new DocumentBuilder()
    .setTitle('Flex Marketplace API:Gateway')
    .setDescription('Flex Marketplace API Gateway')
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'apiKey',
        scheme: 'JWT',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Type into the text box: Bearer {your JWT token}',
        in: 'header',
      },
      'JWT',
    )
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerDocOptions);
  SwaggerModule.setup('/docs', app, swaggerDoc); // to get json file goto /docs-json
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSwagger(app);
  app.enableCors();

  const PORT = configuration().api_port;
  await app.listen(PORT, () => {
    console.log(`Marketplace api is running on port ${PORT}`);
  });
}
bootstrap();
