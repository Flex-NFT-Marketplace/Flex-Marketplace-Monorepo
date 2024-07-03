import { ApiProperty } from '@nestjs/swagger';

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
