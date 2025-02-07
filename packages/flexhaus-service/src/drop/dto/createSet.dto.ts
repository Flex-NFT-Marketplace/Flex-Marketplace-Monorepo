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

  startTime: number;

  expiryTime: number;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  eventId?: string;
}
