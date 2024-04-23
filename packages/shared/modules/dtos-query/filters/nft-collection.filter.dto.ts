import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';

export class NftCollectionQueryParams extends BaseQueryParams {
  @ApiProperty()
  nftContract?: string;
  @ApiProperty()
  chain?: string;
  @ApiProperty()
  standard?: string;
  @ApiProperty()
  verified?: boolean;
}
