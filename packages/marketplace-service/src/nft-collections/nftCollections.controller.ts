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
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
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
}
