import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class SubscribeDTO {
  @ApiProperty()
  @IsHexadecimal()
  creator: string;
}
