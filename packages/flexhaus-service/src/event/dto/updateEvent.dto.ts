import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsHexadecimal, IsOptional } from 'class-validator';

export class UpdateEventDto {
  @ApiProperty()
  @IsHexadecimal()
  eventId: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  snapshotTime?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  startTime?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  perks?: string;
}
