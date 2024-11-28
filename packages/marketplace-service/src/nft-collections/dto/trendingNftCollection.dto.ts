import { IsHexadecimal, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';
import { NftCollectionDto } from '@app/shared/models';

export class TrendingNftCollectionsQueryDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  nftContract?: string;
}

export class TrendingNftCollectionsDto {
  @ApiProperty()
  nftCollections: NftCollectionDto;

  @ApiProperty()
  oneDayChange: number;

  @ApiProperty()
  oneDayVol: number;

  @ApiProperty()
  totalVol: number;

  @ApiProperty()
  totalOwners: number;

  @ApiProperty()
  totalSupply: number;

  @ApiProperty()
  floorPrice: number;
}
