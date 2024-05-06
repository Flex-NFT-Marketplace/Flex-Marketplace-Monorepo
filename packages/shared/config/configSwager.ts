import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication) {
  const swaggerDocOptions = new DocumentBuilder()
    .setTitle('Flex Marketplace API:Gateway')
    .setDescription('Flex Marketplace API Gateway Document Description Content')
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
