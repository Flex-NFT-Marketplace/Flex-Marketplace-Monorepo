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
  Header,
  Inject,
  Res,
} from '@nestjs/common';
import { WarpcastService } from './warpcast.service';
import { BaseResult } from '@app/shared/types';
import { GetWarpcastDto } from './dto/getWarpcast.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GetStartFrameDto } from './dto/getStartFrame.dto';
import { Response } from 'express';

@ApiTags('Warpcast')
@Controller('warpcast')
@ApiExtraModels(Buffer, String)
export class WarpcastController {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly warpcastService: WarpcastService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get Warpcast Detail',
  })
  async getWarpcastDetail(@Query() query: GetWarpcastDto) {
    return await this.warpcastService.getWarpcastDetail(query);
  }

  @Get('image-message')
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
  async getImageMessage(@Res() res: Response, @Query() query: GetWarpcastDto) {
    const key = `image-message - ${JSON.stringify({ ...query })}`;
    let data = await this.cacheManager.get(key);

    if (!data) {
      data = await this.warpcastService.getImageMessage(query);
      await this.cacheManager.set(key, data, 60 * 60 * 1e3);
    }
    res.setHeader('Content-Type', 'image/png');
    res.end(data);
  }

  @Post('start-frame')
  @ApiOperation({
    summary: 'Get start frame',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(String),
        },
      ],
    },
  })
  async getStartFrame(@Body() query: GetStartFrameDto) {
    return await this.warpcastService.getStartFrame(query);
  }

  @Post('react-frame')
  @ApiOperation({
    summary: 'Get react frame',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(String),
        },
      ],
    },
  })
  async getReactFrame(@Body() query: GetStartFrameDto) {
    return await this.warpcastService.getReactFrame(query);
  }

  @Post('follow-frame')
  @ApiOperation({
    summary: 'Get follow frame',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(String),
        },
      ],
    },
  })
  async getFollowFrame(@Body() query: GetStartFrameDto) {
    return await this.warpcastService.getFollowFrame(query);
  }

  @Post('mint-frame')
  @ApiOperation({
    summary: 'Mint frame',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(String),
        },
      ],
    },
  })
  async getMintFrame(@Body() query: GetStartFrameDto) {
    return await this.warpcastService.getMintFrame(query);
  }

  @Post('minted-transaction')
  @ApiOperation({
    summary: 'Get Transaction of minting frame',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(String),
        },
      ],
    },
  })
  async getTransaction(@Body() query: GetStartFrameDto) {
    return await this.warpcastService.getTxMintedFrame(query);
  }
}
