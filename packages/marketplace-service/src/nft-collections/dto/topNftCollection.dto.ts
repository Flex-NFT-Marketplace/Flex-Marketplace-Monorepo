import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';

export class TopNftCollectionQueryDto extends BaseQueryParams {
  @ApiProperty()
  nftContract?: string;
}

export class TopNftCollectionDto {
  @ApiProperty()
  nftContract: string;

  @ApiProperty()
  oneDayChange: number;

  @ApiProperty()
  sevenDayChange: number;

  @ApiProperty()
  oneDayVol: number;

  @ApiProperty()
  sevenDayVol: number;

  @ApiProperty()
  totalVol: number;

  @ApiProperty()
  owners: number;

  @ApiProperty()
  supply: number;
}
