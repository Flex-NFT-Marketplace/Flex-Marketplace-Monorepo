import { ResponseData } from '@app/shared/types/response';
import { UploadService } from './upload.service';
import {
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
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpMessage, HttpStatus } from '@app/shared/types/enum.type';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // let response = await this.uploadService.uploadImage(
    //   file.originalname,
    //   file.buffer,
    // );
    // return response;
  }

  @Get(':file_name')
  async getListFile(@Param('file_name') file_name: string) {
    return await this.uploadService.getUrlFile(file_name);
  }

  @Post(':image_url')
  async uploadFileFromUrl(@Param('image_url') image_url: string) {
    let res = await this.uploadService.downloadImage(image_url, 'a.png');
    return new ResponseData(res, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }
}
