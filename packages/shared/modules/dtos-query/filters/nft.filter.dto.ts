import { Attribute, MarketType } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';

export class NftFilterQueryParams extends BaseQueryParams {
  @ApiProperty({ type: String, required: false })
  name?: string;

  @ApiProperty({ type: String, required: false })
  owner?: string;

  @ApiProperty()
  nftContract?: string;

  @ApiProperty({ type: Number, required: false, minimum: 1 })
  tokenId?: number;
  @ApiProperty({ enum: MarketType, example: MarketType.NotForSale })
  marketType?: MarketType;

  @ApiProperty({
    type: Array,
    required: false,
    example: [{ trait_type: 'string', value: 'value' }],
  })
  attributes?: Attribute[];
}
