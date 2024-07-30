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
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDto implements Attribute {
  @ApiProperty()
  @IsString()
  trait_type: string;

  @ApiProperty()
  @IsDefined()
  value: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  display_type?: string;
}

export class NftFilterQueryParams extends BaseQueryParams {
  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  name?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsHexadecimal()
  owner?: string;

  @IsOptional()
  @ApiProperty()
  @IsHexadecimal()
  nftContract?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false, minimum: 1 })
  @IsString()
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
