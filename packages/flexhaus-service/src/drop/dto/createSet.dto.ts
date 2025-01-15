import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexadecimal,
  IsNumber,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateSetDto {
  @ApiProperty()
  @IsHexadecimal()
  collectible: string;

  @IsNumber()
  startTime: number;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  eventId?: string;
}
