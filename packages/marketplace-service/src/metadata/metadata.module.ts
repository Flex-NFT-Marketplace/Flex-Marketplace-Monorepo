import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Metadata, MetadataSchema } from '@app/shared/models';
import { UploadService } from '../upload/upload.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Metadata.name, schema: MetadataSchema },
    ]),
  ],
  controllers: [MetadataController],
  providers: [MetadataService, UploadService, ConfigService],
  exports: [MetadataService],
})
export class MetadataModule {}
