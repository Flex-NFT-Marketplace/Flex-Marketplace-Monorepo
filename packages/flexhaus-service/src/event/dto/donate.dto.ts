import { IsNumber, IsHexadecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DonateDto {
  @ApiProperty()
  @IsHexadecimal()
  creator: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
