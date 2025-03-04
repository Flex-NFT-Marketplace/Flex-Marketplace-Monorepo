import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MetadataDTO } from './metadata.dto';
import { MetadataService } from './metadata.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpStatus, HttpMessage } from '@app/shared/types/enum.type';
import { ResponseData } from '@app/shared/types/response';
import { ApiTags, ApiBody, ApiConsumes, getSchemaPath } from '@nestjs/swagger';
import { FileExtender } from './fileExtender';

@ApiTags('Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @Post('single')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },

        description: { type: 'string' },

        external_url: { type: 'string' },

        attributes: { type: 'object' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async createMetadata(
    @Body() metadataDTO: MetadataDTO,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    let path = await this.metadataService.createMetadata(metadataDTO, file);

    return new ResponseData(path, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }

  @Post('multiple')
  @UseInterceptors(FileInterceptor('file'))
  async createMultipleMetadata(
    @Body() metadataDTO: MetadataDTO,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    let path = this.metadataService.createMetadata(metadataDTO, file);

    return path;
  }

  @Get(':id')
  async getMetadata(@Param('id') id: string) {
    return await this.metadataService.getMetadata(id);
  }
}
