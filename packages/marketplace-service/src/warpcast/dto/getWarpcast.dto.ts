import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsOptional, IsString, IsNumber } from 'class-validator';

export class GetWarpcastDto {
  @IsHexadecimal()
  @ApiProperty()
  nftContract: string;

  @ApiProperty()
  @IsNumber()
  phaseId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  message?: string;
}
