import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';

export class NftCollectionHoldersQuery extends BaseQueryParams {
  @ApiProperty()
  nftContract: string;
}

export class NftCollectionHolders {
  @ApiProperty()
  owner: string;

  @ApiProperty()
  totalNfts: number;

  @ApiProperty()
  percentage: number;
}
