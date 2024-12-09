import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class AddCollectible {
  @ApiProperty()
  @IsHexadecimal()
  setId: string;

  @ApiProperty()
  @IsHexadecimal()
  collectible: string;
}
