import { ApiProperty } from '@nestjs/swagger';

export class ChainDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  rpc: string;
  @ApiProperty()
  explorer: string;
  @ApiProperty()
  deployerContract: string;
  @ApiProperty()
  marketplaceContract: string[];
  @ApiProperty()
  currentMarketplaceContract: string;
  @ApiProperty()
  royaltyManagerContract: string;
  @ApiProperty()
  royaltyRegistryContract: string;
  @ApiProperty()
  currencyManagerContract: string;
  @ApiProperty()
  executeManagerContract: string;
  @ApiProperty()
  signatureCheckerContract: string;
  @ApiProperty()
  strategyForAnyItemFromCollectionFixedPrice?: string;
  @ApiProperty()
  strategyHighestBidder?: string;
  @ApiProperty()
  strategyPrivateSale?: string;
  @ApiProperty()
  strategyStandardSaleForFixedPrice?: string;
  @ApiProperty()
  transferManagerERC721?: string;
  @ApiProperty()
  transferManagerERC1155?: string;
  @ApiProperty()
  transferSelectorNFT?: string;
  @ApiProperty()
  flexDropContract?: string;
  @ApiProperty()
  erc721FlexDropClassHash?: string;
  @ApiProperty()
  delayBlock: number;
}
