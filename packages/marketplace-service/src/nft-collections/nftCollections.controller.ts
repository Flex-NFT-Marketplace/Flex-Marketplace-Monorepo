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
} from '@nestjs/common';
import { NftCollectionsService } from './nftCollections.service';

import { BaseResult } from '@app/shared/types/base.result';
import { NftCollectionDto } from '@app/shared/models';
import { NftCollectionQueryParams } from './dto/nftCollectionQuery.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';

@ApiTags('NFT Collections')
@Controller('nft-collection')
@ApiExtraModels(NftCollectionQueryParams, NftCollectionDto, BadRequestException)
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
}
