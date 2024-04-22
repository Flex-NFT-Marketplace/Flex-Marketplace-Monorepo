import { ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { NftService } from './nfts.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';

import { NftFilterQueryParams } from '@app/shared/modules/dtos-query';

@ApiTags('NFTs')
@Controller('nfts')
@ApiExtraModels(NftFilterQueryParams, PaginationDto)
export class NftController {
  constructor(private readonly nftsService: NftService) {}
  @Post('/getNftsByOwner')
  async getNftsByOwner(@Body() query: NftFilterQueryParams) {
    return await this.nftsService.getNftsByOwner(query);
  }
}
