import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class NftCollectionHoldersQuery extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
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
