import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

@Controller('nft-collections')
@ApiTags('NFT Collections')
export class NftCollectionsController {
  constructor() {}
  @Get('/list')
  async getListNFTCollections() {
    return 'List Collections';
  }
  @ApiTags('/detail/:nftContract')
  async getNFTCollectionDetail() {}
}
