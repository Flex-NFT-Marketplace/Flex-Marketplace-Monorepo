import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexadecimal,
  IsMongoId,
  IsNumber,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { NftCollectionStandard, NftCollectionStatus } from '../types';
import { Transform } from 'class-transformer';

export class NftCollectionDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  key: string;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
  nftContract: string;

  @IsUrl()
  cover?: string;

  @IsUrl()
  avatar?: string;

  @IsUrl()
  featuredImage?: string;

  @IsString()
  description: string;

  @IsMongoId()
  owner: ObjectId;

  @IsMongoId()
  chain: ObjectId;

  @IsEnum(NftCollectionStandard)
  standard: NftCollectionStandard;

  @IsArray()
  paymentTokens: ObjectId[];

  @IsEnum(NftCollectionStatus)
  status?: NftCollectionStatus;

  @IsBoolean()
  verified?: boolean;

  @IsNumber()
  royaltyRate?: number;

  @IsArray()
  collaboratories: ObjectId[];
}
