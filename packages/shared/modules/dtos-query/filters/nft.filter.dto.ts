import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class NftFilterQueryParams extends BaseQueryParams {
  @ApiProperty({})
  owner?: string;

  @ApiProperty()
  nftContract?: string;

  @ApiProperty()
  @IsNumber()
  tokenId?: number;
}
