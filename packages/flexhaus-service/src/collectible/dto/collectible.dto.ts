import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class CollectibleDto {
  @ApiProperty()
  @IsHexadecimal()
  collectible: string;
}
