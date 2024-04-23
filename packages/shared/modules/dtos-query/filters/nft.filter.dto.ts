import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';

export class NftFilterQueryParams extends BaseQueryParams {
  @ApiProperty({ type: String, required: false })
  owner?: string;

  @ApiProperty()
  nftContract?: string;

  @ApiProperty({ type: Number, required: false, minimum: 1 })
  tokenId?: number;
}
