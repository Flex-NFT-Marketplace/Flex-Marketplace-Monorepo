import { Injectable, Logger } from '@nestjs/common';
import { MetadataDTO } from './metadata.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Metadata } from '@app/shared/models';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class MetadataService {
  private logger: Logger;
  constructor(
    @InjectModel(Metadata.name) private metadataModel: Model<Metadata>,
    private uploadService: UploadService,
  ) {}

  async createMetadata(metadataDTO: MetadataDTO, file: Express.Multer.File) {
    try {
      let metadata = await this.metadataModel.create(metadataDTO);

      let path = await this.uploadService.uploadImage(
        metadata._id.toString(),
        file.buffer,
      );

      metadata.image = path;

      let res = await metadata.save();
      return res._id;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getMetadata(id: string) {
    try {
      const metadata = await this.metadataModel.findById(id, {
        __v: 0,
      });

      return metadata;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
