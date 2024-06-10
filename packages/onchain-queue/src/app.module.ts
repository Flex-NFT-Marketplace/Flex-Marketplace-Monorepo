import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { OnchainQueueModule } from './queues/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().db_path),
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        imports: [ConfigModule],
        redis: {
          host: config.get('QUEUE_HOST'),
          port: config.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    OnchainQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
