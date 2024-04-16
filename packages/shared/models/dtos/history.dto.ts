import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsHexadecimal,
  IsMongoId,
  IsNumber,
  Length,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { HistoryType } from '../types';

export class HistoryDto {
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

  @IsMongoId()
  from: ObjectId;

  @IsMongoId()
  to: ObjectId;

  @IsNumber()
  price: number;

  @IsNumber()
  priceInUsd: number;

  @IsHexadecimal()
  txHash: string;

  @IsNumber()
  timestamp: number;

  @IsMongoId()
  chain: ObjectId;

  @IsEnum(HistoryType)
  type: HistoryType;

  @IsMongoId()
  sale?: ObjectId;

  @IsMongoId()
  paymentToken?: ObjectId;
}
