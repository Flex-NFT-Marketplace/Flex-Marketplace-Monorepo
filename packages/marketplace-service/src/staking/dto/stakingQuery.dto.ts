import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';

export class StakingQueryDto extends BaseQueryParams {
  @ApiProperty()
  nftContract?: string;

  @ApiProperty()
  tokenId?: string;

  @ApiProperty()
  userAddress?: string;
}
