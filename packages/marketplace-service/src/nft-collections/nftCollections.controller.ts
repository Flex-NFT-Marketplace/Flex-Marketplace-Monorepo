import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Controller, Get, Body, Post, Param, HttpCode } from '@nestjs/common';
import { NftCollectionsService } from './nftCollections.service';

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

@ApiTags('NFT Collections')
@Controller('nft-collection')
@ApiExtraModels(NftCollectionQueryParams, NftCollectionDto)
export class NftCollectionsController {
  constructor(private readonly nftCollectionService: NftCollectionsService) {}
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
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            error: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async getListNFTCollections(@Body() query: NftCollectionQueryParams) {
    try {
      const data = await this.nftCollectionService.getListNFTCollections(query);
      return new BaseResult({
        success: true,
        data: data,
      });
    } catch (error) {
      return new BaseResult({
        success: false,
        error: error.message,
      });
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
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async getNFTCollectionDetail(
    @Param('nftContract') nftContract: string,
  ): Promise<BaseResult<any>> {
    try {
      const data =
        await this.nftCollectionService.getNFTCollectionDetail(nftContract);
      return new BaseResult({
        success: true,
        data: data,
      });
    } catch (error) {
      return new BaseResult({
        success: false,
        error: error.message,
      });
    }
  }

  @Get('total-owner/:nftContract')
  async getTotalOwnerOfCollection(
    @Param('nftContract') param: string,
  ): Promise<BaseResult<number>> {
    try {
      if (!isValidAddress(param)) {
        throw new Error('Invalid Nft Address');
      }
      const key = `total-owner - ${param}`;
      let result: BaseResult<number> = await this.cacheManager.get(key);
      if (!result) {
        result = await this.nftCollectionService.getTotalOwners(param);
      }

      return new BaseResult(0);
    } catch (error) {
      throw new Error(error);
    }
  }
}
