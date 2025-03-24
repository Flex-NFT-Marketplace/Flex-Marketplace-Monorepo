import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class CollectionAddressDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;
}
