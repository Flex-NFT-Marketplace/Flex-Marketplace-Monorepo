import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingBannerCollectionDto } from './dto/settingSystem.dto';

import { SystemService } from './system.service';
import { JWTAdmin } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types';

@ApiTags('System Setting')
@Controller('system-setting')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('/bannerCollection')
  async getBannerNftCollection() {
    try {
      const data = await this.systemService.getBannerTop();
      return new BaseResult(data);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Something went wrong in get banner collection',
      );
    }
  }

  @JWTAdmin()
  @Post('/bannerCollection')
  @ApiOperation({ summary: 'Choose  Contract Address to set banner' })
  async settingBannerNftCollection(@Body() body: SettingBannerCollectionDto) {
    try {
      const data = await this.systemService.settingBannerTop(body);
      return new BaseResult(data);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Something went wrong in Setting banner');
    }
  }
}
