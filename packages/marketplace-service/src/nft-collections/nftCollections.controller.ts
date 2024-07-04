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
  BadRequestException,
  Inject,
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
import { isValidAddress } from '@app/shared/utils';
import { updateCollectionMetadataDto } from './dto/updateCollectionMetadata.dto';
import { isHexadecimal } from 'class-validator';
import { NFTCollectionSuply } from './dto/CollectionSupply.dto';

@ApiTags('NFT Collections')
@Controller('nft-collection')
@ApiExtraModels(
  NftCollectionQueryParams,
  NftCollectionDto,
  TopNftCollectionDto,
  updateCollectionMetadataDto,
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
    try {
      const data = await this.nftCollectionService.getListNFTCollections(query);
      return data;
    } catch (error) {
      return new BadRequestException(error.message);
    }
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
      const data =
        await this.nftCollectionService.getNFTCollectionDetail(nftContract);
      return new BaseResult(data);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
    try {
      const key = `top-collection - ${JSON.stringify({ ...query })}`;
      let data = await this.cacheManager.get(key);
      if (!data) {
        data = await this.nftCollectionService.getTopNFTCollection(query);
        await this.cacheManager.set(key, data, 60 * 60 * 1e3);
      }
      return data;
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @Get('total-suppply/:nftContract')
  async getTotalOwnerOfCollection(
    @Param('nftContract') param: string,
  ): Promise<BaseResult<NFTCollectionSuply>> {
    try {
      if (!isValidAddress(param.replace('0x', ''))) {
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

  @Post('update-collection-metadata')
  @ApiOperation({
    summary: 'update All NFTs metadata',
  })
  async updateCollectionMetadata(
    @Body() body: updateCollectionMetadataDto,
  ): Promise<BaseResult<boolean>> {
    try {
      if (!isHexadecimal(body.nftContract)) {
        throw new Error('Invalid Address');
      }
      await this.nftCollectionService.updateCollectionMetadatas(
        body.nftContract,
      );

      return new BaseResult(true);
    } catch (error) {
      throw new Error(error);
    }
  }
}
