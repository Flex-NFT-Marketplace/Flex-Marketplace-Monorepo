import { NftCollectionStandard, NftCollectionStatus } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';

export class NftCollectionQueryParams extends BaseQueryParams {
  @ApiProperty()
  nftContract?: string;
  @ApiProperty()
  chain?: string;
  @ApiProperty({
    enum: NftCollectionStandard,
    example: NftCollectionStandard.ERC721,
  })
  standard?: NftCollectionStandard;
  @ApiProperty()
  verified?: boolean;
  @ApiProperty()
  owner?: string;
  @ApiProperty({
    enum: NftCollectionStatus,
    example: NftCollectionStatus.Active,
  })
  status?: NftCollectionStatus = NftCollectionStatus.Active;
}
