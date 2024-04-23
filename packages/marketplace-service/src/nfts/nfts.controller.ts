import {
  ApiTags,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { NftService } from './nfts.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';

import { NftFilterQueryParams } from '@app/shared/modules/dtos-query';

import { NftDto } from '@app/shared/models';
import { BaseResult } from '@app/shared/types/base.result';

@ApiTags('NFTs')
@Controller('nft')
@ApiExtraModels(NftFilterQueryParams, PaginationDto, NftDto)
export class NftController {
  constructor(private readonly nftsService: NftService) {}
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
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(PaginationDto),
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
  async getNfts(@Body() query: NftFilterQueryParams) {
    try {
      const data = await this.nftsService.getNftsByQuery(query);
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
