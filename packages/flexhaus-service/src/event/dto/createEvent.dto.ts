import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsNumber()
  snapshotTime: number;

  @ApiProperty()
  @IsNumber()
  startTime: number;

  @ApiProperty()
  @IsString()
  perks: string;
}
