import {
  IsHexadecimal,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDTO {
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartItemDTO)
  items: AddToCartItemDTO[];
}

export class AddToCartItemDTO {
  @ApiProperty({
    required: true,
    description: 'nft contract address',
  })
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  tokenId: string;
}
