import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';

export class NftFilterQueryParams extends BaseQueryParams {
  @ApiProperty({})
  owner?: string;

  @ApiProperty()
  nftContract?: string;

  @ApiProperty()
  tokenId?: string;
}
