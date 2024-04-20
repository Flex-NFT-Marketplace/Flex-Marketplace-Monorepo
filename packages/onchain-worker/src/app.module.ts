import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockDetectionModule } from './blocks-detection/block-detection.module';
import configuration from '@app/shared/configuration';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().db_path),
    BlockDetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
