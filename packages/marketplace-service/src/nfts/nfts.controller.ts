import {
  ApiTags,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  HttpCode,
  Get,
  Query,
  Inject,
} from '@nestjs/common';
import { NftService } from './nfts.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ChainDto, NftDto, PaymentTokenDto, UserDto } from '@app/shared/models';
import { Cache } from 'cache-manager';
import { NftFilterQueryParams } from './dto/nftQuery.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { GetNftQueryDto } from './dto/getNftQuery.dto';

@ApiTags('NFTs')
@Controller('nft')
@ApiExtraModels(
  NftFilterQueryParams,
  PaginationDto,
  NftDto,
  ChainDto,
  PaymentTokenDto,
  UserDto,
)
export class NftController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly nftsService: NftService,
  ) {}
  @Post('/get-nfts')
  @ApiOperation({
    summary: 'Get Nfts By Query params',
    description:
      'Use this API to get the NFTs by query params include: <b>owner</b>, <b>nftContract</b>,<b>tokenId  </b>, sort, page, size.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(NftDto),
                },
                {
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(NftDto),
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getNfts(@Body() query: NftFilterQueryParams) {
    // const key = `get-nfts - ${JSON.stringify({ ...query })}`;
    let data = null; //await this.cacheManager.get(key);
    if (!data) {
      data = await this.nftsService.getNftsByQuery(query);
      // await this.cacheManager.set(key, data, 300000);
    }
    return data;
  }

  @Get('get-nft')
  @ApiOperation({
    summary: 'Get NFT detail',
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
                  $ref: getSchemaPath(NftDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getNftDetail(
    @Query() query: GetNftQueryDto,
  ): Promise<BaseResult<NftDto>> {
    return await this.nftsService.getNftDetail(query);
  }
}
