import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockDetectionModule } from './blocks-detection/block-detection.module';
import configuration from '@app/shared/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MailingModule } from './mailing/mailing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().db_path),
    BlockDetectionModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('QUEUE_HOST'),
          port: config.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    MailingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
