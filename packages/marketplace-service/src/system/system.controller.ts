import { JWT } from '@app/shared/modules';
import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import sharp from 'sharp';
// import fs from 'fs';
// import { diskStorage } from 'multer';
// import * as path from 'path';
// import configuration from '@app/shared/configuration';
// import {
//   editFileName,
//   imageFileFilter,
// } from '@app/shared/modules/img/image.service';
@ApiTags('System Setting')
@Controller('system-setting')
export class SystemController {
  constructor() {}

  @Get('/bannerCollection')
  async getBannerNftCollection() {}

  // @JWT()
  // @Post('/bannerTop')
  // @ApiOperation({ summary: 'Upload multiple files' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'The files have been successfully uploaded.',
  // })
  // @ApiResponse({ status: 400, description: 'Invalid file format.' })
  // @UseInterceptors(
  //   FilesInterceptor('image', 20, {
  //     storage: diskStorage({
  //       destination: configuration().file_storage_path,
  //       filename: editFileName,
  //     }),
  //     fileFilter: imageFileFilter,
  //   }),
  // )
  // async settingBannerTop(@UploadedFiles() files, @Body() body) {
  //   const fileType = body.fileType || 'logo';
  //   const response = [];

  //   const { width, height } =
  //     configuration().image_dimension[fileType] ||
  //     configuration().image_dimension.logo;

  //   for (const file of files) {
  //     const tempFilePath = `${file.destination}/temp-${file.filename}`;

  //     if (fileType === 'logo' || fileType === 'banner') {
  //       await sharp(file.path).resize(width, height).toFile(tempFilePath);

  //       fs.unlinkSync(file.path);

  //       fs.renameSync(tempFilePath, `${file.destination}/${file.filename}`);
  //     }

  //     response.push({
  //       originalname: file.originalname,
  //       filename: file.filename,
  //     });
  //   }

  //   return response;
  // }

  @JWT()
  @Post('/bannerCollection')
  @ApiOperation({ summary: 'Choose Smart Contract Addess to set banner' })
  async settingBannerNftCollection() {}
}
