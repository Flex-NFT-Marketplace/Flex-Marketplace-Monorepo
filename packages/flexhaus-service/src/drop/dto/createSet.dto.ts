import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNumber } from 'class-validator';

export class CreateSetDto {
  @ApiProperty()
  @IsHexadecimal()
  collectible: string;

  @IsNumber()
  startTime: number;
}
