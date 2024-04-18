import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsHexadecimal,
  IsMongoId,
  IsNumber,
  Length,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { MarketStatus } from '../types';

export class SaleDto {
  @IsMongoId()
  nft: ObjectId;

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

  @IsArray()
  @ArrayMaxSize(2)
  @ArrayMinSize(2)
  signedSignature: string[];

  @IsNumber()
  saltNonce: number;

  @IsNumber()
  startTime: number;

  @IsNumber()
  endTime: number;

  @IsNumber()
  price: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  remainingAmount: number;

  @IsMongoId()
  paymentToken: ObjectId;

  @IsEnum(MarketStatus)
  status: MarketStatus;
}