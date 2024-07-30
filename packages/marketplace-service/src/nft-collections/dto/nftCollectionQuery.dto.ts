import { NftCollectionStandard, NftCollectionStatus } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsHexadecimal,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class NftCollectionQueryParams extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  nftContract?: string;

  @IsOptional()
  @ApiProperty({
    enum: NftCollectionStandard,
    example: NftCollectionStandard.ERC721,
  })
  @IsEnum(NftCollectionStandard)
  standard?: NftCollectionStandard;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @ApiProperty()
  @IsHexadecimal()
  owner?: string;

  @IsOptional()
  @ApiProperty({
    enum: NftCollectionStatus,
    example: NftCollectionStatus.Active,
  })
  @IsEnum(NftCollectionStatus)
  status?: NftCollectionStatus = NftCollectionStatus.Active;

  @IsOptional()
  @ApiProperty()
  @IsString()
  name?: string;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  isNonFungibleFlexDropToken?: boolean;
}
