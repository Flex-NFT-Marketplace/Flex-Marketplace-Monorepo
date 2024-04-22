import {
  ApiTags,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { NftService } from './nfts.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';

import { NftFilterQueryParams } from '@app/shared/modules/dtos-query';
import { BaseResultPagination } from '@app/shared/types/base.result.pagination';
import { NftDto } from '@app/shared/models';

@ApiTags('NFTs')
@Controller('nfts')
@ApiExtraModels(NftFilterQueryParams, PaginationDto, BaseResultPagination)
export class NftController {
  constructor(private readonly nftsService: NftService) {}
  @Post('/getNftsByOwner')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'API Get Token ',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(NftDto) },
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
          properties: {
            error: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async getNftsByOwner(@Body() query: NftFilterQueryParams) {
    return await this.nftsService.getNftsByOwner(query);
  }
}
