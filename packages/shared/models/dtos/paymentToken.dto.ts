import {
  IsBoolean,
  IsHexadecimal,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentTokenDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  symbol: string;

  @IsNumber()
  @ApiProperty()
  decimals: number;

  @IsHexadecimal()
  @Length(66, 66)
  @ApiProperty()
  contractAddress: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsBoolean()
  isNative: boolean; // ETH and STRK
}
