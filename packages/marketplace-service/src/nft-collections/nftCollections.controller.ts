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
  Param,
  HttpCode,
  Inject,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { NftCollectionsService } from './nftCollections.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BaseResult } from '@app/shared/types/base.result';
import { NftCollectionDto } from '@app/shared/models';
import { NftCollectionQueryParams } from './dto/nftCollectionQuery.dto';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import {
  TopNftCollectionDto,
  TopNftCollectionQueryDto,
} from './dto/topNftCollection.dto';
import { updateCollectionMetadataDto } from './dto/updateCollectionMetadata.dto';
import { isHexadecimal } from 'class-validator';
import { NFTCollectionSuply } from './dto/CollectionSupply.dto';
import { JWT, User } from '@app/shared/modules';
import {
  NftCollectionHolders,
  NftCollectionHoldersQuery,
} from './dto/CollectionHolders.dto';
import { NftCollectionAttributeDto } from './dto/CollectionAttribute.dto';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { UpdateCollectionDetailDto } from './dto/updateCollectionDetail.dto';
import {
  TrendingNftCollectionsDto,
  TrendingNftCollectionsQueryDto,
} from './dto/trendingNftCollection.dto';

@ApiTags('NFT Collections')
@Controller('nft-collection')
@ApiExtraModels(
  NftCollectionQueryParams,
  NftCollectionDto,
  TopNftCollectionDto,
  updateCollectionMetadataDto,
  NftCollectionHolders,
  NftCollectionAttributeDto,
  UpdateCollectionDetailDto,
  TrendingNftCollectionsDto,
  TrendingNftCollectionsQueryDto,
)
export class NftCollectionsController {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly nftCollectionService: NftCollectionsService,
  ) {}
  @Post('/get-collections')
  @ApiOperation({
    summary: 'Get List NFT Collections',
    description:
      'Use this API to get the list NFTs by query params include:<b>standard  </b>, <b>nftContract</b>,<b>chain  </b>, sort, page, size.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(PaginationDto),
        },
        {
          properties: {
            items: {
              allOf: [
                {
                  $ref: getSchemaPath(NftCollectionDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getListNFTCollections(@Body() query: NftCollectionQueryParams) {
    const data = await this.nftCollectionService.getListNFTCollections(query);
    return data;
  }
  @Get('/:nftContract')
  @ApiOperation({
    summary: 'Get  NFT Detail Collections',
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
                  $ref: getSchemaPath(NftCollectionDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getNFTCollectionDetail(@Param('nftContract') nftContract: string) {
    try {
      if (!isHexadecimal(nftContract)) {
        throw new HttpException('Invalid Nft Contract', HttpStatus.BAD_REQUEST);
      }
      const data =
        await this.nftCollectionService.getNFTCollectionDetail(nftContract);
      return new BaseResult(data);
    } catch (error) {
      console.log('WHat Wrong', error);
    }
  }

  @Post('holders')
  @ApiOperation({
    summary: 'List of holders of specific collection',
  })
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
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(NftCollectionHolders),
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
  async topHolder(
    @Body() query: NftCollectionHoldersQuery,
  ): Promise<BaseResultPagination<NftCollectionHolders>> {
    try {
      return await this.nftCollectionService.getTopHolders(query);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('attributes/:nftContract')
  @ApiOperation({
    summary:
      'Get total attributes and total items of each attribute of collection.',
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
                  $ref: getSchemaPath(NftCollectionAttributeDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getAttributes(
    @Param('nftContract') nftContract: string,
  ): Promise<BaseResult<NftCollectionAttributeDto[]>> {
    if (!isHexadecimal(nftContract)) {
      throw new Error('Invalid Nft Contract');
    }

    const attributes =
      await this.nftCollectionService.getAttributes(nftContract);

    return new BaseResult(attributes);
  }

  @Post('economic')
  @ApiOperation({
    summary:
      'Getting Top NFT Collection Base On Total Vol, If there is no nft contract in filter, else geting a statistic of specific Collection.',
  })
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
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(TopNftCollectionDto),
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
  async getTopCollection(
    @Body() query: TopNftCollectionQueryDto,
  ): Promise<BaseResultPagination<TopNftCollectionDto>> {
    const key = `top-collection - ${JSON.stringify({ ...query })}`;
    let data = await this.cacheManager.get(key);
    if (!data) {
      data = await this.nftCollectionService.getTopNFTCollection(query);
      await this.cacheManager.set(key, data, 60 * 60 * 1e3);
    }
    return data;
  }

  @Post('tredingNftCollection')
  @ApiOperation({
    summary: 'Trending NFT Collections',
  })
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
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(TrendingNftCollectionsDto),
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
  async getTrendingNftCollection(
    @Body() query: TrendingNftCollectionsQueryDto,
  ): Promise<BaseResultPagination<TrendingNftCollectionsDto>> {
    const key = `trending-nft-collection- ${JSON.stringify({ ...query })}`;
    let data = await this.cacheManager.get(key);
    if (!data) {
      data = await this.nftCollectionService.getTrendingNFTCollections(query);
      await this.cacheManager.set(key, data, 60 * 60 * 1e3);
    }
    return data;
  }
  @Get('total-suppply/:nftContract')
  async getTotalOwnerOfCollection(
    @Param('nftContract') param: string,
  ): Promise<BaseResult<NFTCollectionSuply>> {
    try {
      if (!isHexadecimal(param.replace('0x', ''))) {
        throw new Error('Invalid Nft Address');
      }
      const key = `total-owner - ${param}`;
      let result: NFTCollectionSuply = await this.cacheManager.get(key);
      if (!result) {
        result = await this.nftCollectionService.getTotalOwners(param);
        await this.cacheManager.set(key, result, 60 * 60 * 1e3);
      }

      return new BaseResult(result);
    } catch (error) {
      throw new Error(error);
    }
  }

  @JWT()
  @Post('update-collection-detail')
  @ApiOperation({
    summary: 'update NFT Collection detail',
  })
  async updateCollectionDetail(
    @Body() body: UpdateCollectionDetailDto,
    @User() user: iInfoToken,
  ) {
    await this.nftCollectionService.updateCollectionDetail(user.sub, body);
  }

  // @UseGuards(JwtAdminAuthGuard)
  @Post('update-all-nfts-metadata')
  @ApiOperation({
    summary: 'update All NFTs metadata',
  })
  async updateCollectionMetadata(
    @Body() body: updateCollectionMetadataDto,
  ): Promise<BaseResult<boolean>> {
    try {
      const { nftContract, isNew } = body;

      if (!isHexadecimal(nftContract)) {
        throw new Error('Invalid Address');
      }
      await this.nftCollectionService.updateCollectionMetadatas(
        nftContract,
        isNew,
      );

      return new BaseResult(true);
    } catch (error) {
      throw new Error(error);
    }
  }

  // @Post('update-all-nftsCollection-stats')
  // @ApiOperation({
  //   summary: 'update All NFTs Collection stats !TODO Not use',
  // })
  // async updateAllNFTsCollectionStats() {
  //   try {
  //     await this.nftCollectionService.updateAllNftCollectionStatsData();
  //   } catch (error) {
  //     console.log('What Wrog', error);
  //     throw new BadRequestException(error);
  //   }
  // }

  @Post('update-nftCollection-stats/:nftContract')
  @ApiOperation({
    summary: 'update NFT Collection stats',
  })
  async updateNFTCollectionStats(@Param('nftContract') nftContract: string) {
    try {
      if (!isHexadecimal(nftContract)) {
        throw new Error('Invalid Address');
      }

      const data =
        await this.nftCollectionService.getOrCreateNftCollectionStats(
          nftContract,
        );
      return new BaseResult(data);
    } catch (error) {
      throw new Error(error);
    }
  }
}
