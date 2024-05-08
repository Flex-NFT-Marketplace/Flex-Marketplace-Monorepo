import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexadecimal,
  IsNumber,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { NftCollectionStandard, NftCollectionStatus } from '../types';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { PaymentTokenDto } from './paymentToken.dto';

export class NftCollectionDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  symbol: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @ApiProperty()
  key: string;

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

  @IsUrl()
  @ApiProperty()
  cover?: string;

  @IsUrl()
  @ApiProperty()
  avatar?: string;

  @IsUrl()
  @ApiProperty()
  featuredImage?: string;

  @IsString()
  @ApiProperty()
  description: string;

  @ApiProperty({ type: () => UserDto })
  owner: UserDto;

  @IsEnum(NftCollectionStandard)
  @ApiProperty({ enum: NftCollectionStandard })
  standard: NftCollectionStandard;

  @IsArray()
  @ApiProperty({ type: () => [PaymentTokenDto] })
  paymentTokens: PaymentTokenDto[];

  @IsEnum(NftCollectionStatus)
  @ApiProperty({ enum: NftCollectionStatus })
  status?: NftCollectionStatus;

  @IsBoolean()
  @ApiProperty()
  verified?: boolean;

  @IsNumber()
  @ApiProperty()
  royaltyRate?: number;

  @IsArray()
  @ApiProperty({ type: () => [UserDto] })
  collaboratories: UserDto[];
}
