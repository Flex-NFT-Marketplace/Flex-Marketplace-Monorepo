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
  BadRequestException,
} from '@nestjs/common';
import { NftService } from './nfts.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';

import { ChainDto, NftDto, PaymentTokenDto, UserDto } from '@app/shared/models';

import { NftFilterQueryParams } from './dto/nftQuery.dto';
import { BaseResultPagination } from '@app/shared/types';

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
    try {
      const data = await this.nftsService.getNftsByQuery(query);
      return data;
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }
}
