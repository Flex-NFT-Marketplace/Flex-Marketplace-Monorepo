import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Body,
  Post,
  Query,
  HttpException,
  HttpStatus,
  Header,
  Inject,
} from '@nestjs/common';
import { WarpcastService } from './warpcast.service';
import { JWT, User } from '@app/shared/modules';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { BaseResult } from '@app/shared/types';
import { GetImageMessage } from './dto/getImageMessage.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('Warpcast')
@Controller('warpcast')
@ApiExtraModels()
export class WarpcastController {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly warpcastService: WarpcastService,
  ) {}

  @Get('image-message/')
  @Header('Content-Type', 'image/png')
  @ApiOperation({
    summary: 'Get Image message on warpcast',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(Buffer),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getImageMessage(@Query() query: GetImageMessage) {
    const key = `image-message - ${JSON.stringify({ ...query })}`;
    let data = await this.cacheManager.get(key);

    if (!data) {
      data = await this.warpcastService.getImageMessage(query);
      await this.cacheManager.set(key, data, 60 * 60 * 1e3);
    }
    return data;
  }
}
