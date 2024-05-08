import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsHexadecimal,
  IsNumber,
  Length,
} from 'class-validator';
import { MarketStatus } from '../types';
import { NftDto } from './nft.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentTokenDto } from './paymentToken.dto';

export class SaleDto {
  @ApiProperty({ type: () => NftDto })
  nft: NftDto;

  @IsNumber()
  @ApiProperty()
  tokenId: number;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
  @ApiProperty()
  nftContract: string;

  @IsArray()
  @ArrayMaxSize(2)
  @ArrayMinSize(2)
  @ApiProperty()
  signedSignature: string[];

  @IsNumber()
  @ApiProperty()
  saltNonce: number;

  @IsNumber()
  @ApiProperty()
  startTime: number;

  @IsNumber()
  @ApiProperty()
  endTime: number;

  @IsNumber()
  @ApiProperty()
  price: number;

  @IsNumber()
  @ApiProperty()
  amount: number;

  @IsNumber()
  @ApiProperty()
  remainingAmount: number;

  @ApiProperty({ type: () => PaymentTokenDto })
  paymentToken: PaymentTokenDto;

  @IsEnum(MarketStatus)
  @ApiProperty({ enum: MarketStatus })
  status: MarketStatus;
}
