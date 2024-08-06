import { Attribute, MarketType } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types/base.queryparams';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsHexadecimal,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDefined,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDto implements Attribute {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  trait_type: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  value: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  display_type?: string;
}

export class NftFilterQueryParams extends BaseQueryParams {
  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsHexadecimal()
  @IsNotEmpty()
  owner?: string;

  @IsOptional()
  @ApiProperty()
  @IsHexadecimal()
  @IsNotEmpty()
  nftContract?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false, minimum: 1 })
  @IsString()
  @IsNotEmpty()
  tokenId?: string;

  @IsOptional()
  @ApiProperty({ enum: MarketType, example: MarketType.NotForSale })
  @IsEnum(MarketType)
  marketType?: MarketType;

  @IsOptional()
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isBurned?: boolean;
}
