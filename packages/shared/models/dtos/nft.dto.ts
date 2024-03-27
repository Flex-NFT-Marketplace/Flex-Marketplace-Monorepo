import { Transform } from 'class-transformer';
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
import { Attribute, MarketType } from '../types';

export class NftDto {
  @IsNumber()
  tokenId: number;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
  nftContract: string;

  @IsMongoId()
  nftCollection: ObjectId;

  @IsMongoId()
  chain: ObjectId;

  @IsNumber()
  royaltyRate: number;

  @IsString()
  name?: string;

  @IsUrl()
  image: string;

  originalImage: string;

  @IsUrl()
  animationUrl: string;

  @IsString()
  description: string;

  tokenUri: string;

  @IsMongoId()
  creator: ObjectId;

  @IsMongoId()
  owner: ObjectId;

  amount: number;

  @IsArray()
  attributes: Attribute[];

  @IsEnum(MarketType)
  marketType: MarketType;

  @IsBoolean()
  isBurned?: boolean;

  @IsNumber()
  burnedAt?: number;

  @IsMongoId()
  sales?: ObjectId;
}
