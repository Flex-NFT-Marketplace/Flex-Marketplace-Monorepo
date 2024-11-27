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

  @JWT()
  @Post('/bannerCollection')
  @ApiOperation({ summary: 'Choose Smart Contract Addess to set banner' })
  async settingBannerNftCollection() {}
}
