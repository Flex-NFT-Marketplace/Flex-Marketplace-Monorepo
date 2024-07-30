import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsOptional } from 'class-validator';

export class TopNftCollectionQueryDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
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
}
