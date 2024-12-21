import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNumber, IsMongoId } from 'class-validator';

export class CreateSetDto {
  @ApiProperty()
  @IsMongoId()
  eventId: string;

  @ApiProperty()
  @IsHexadecimal()
  collectible: string;

  @IsNumber()
  startTime: number;
}
