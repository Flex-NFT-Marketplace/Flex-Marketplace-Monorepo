import { ContractStandard, NftCollectionStatus } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsHexadecimal,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class NftCollectionQueryParams extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  @IsNotEmpty()
  nftContract?: string;

  @IsOptional()
  @ApiProperty({
    enum: ContractStandard,
    example: ContractStandard.ERC721,
  })
  @IsEnum(ContractStandard)
  standard?: ContractStandard;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @ApiProperty()
  @IsHexadecimal()
  @IsNotEmpty()
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
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isNonFungibleFlexDropToken?: boolean;
}
