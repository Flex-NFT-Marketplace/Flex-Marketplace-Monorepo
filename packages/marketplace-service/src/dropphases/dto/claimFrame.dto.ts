import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNumber } from 'class-validator';

export class ClaimFrameDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty()
  @IsNumber()
  phaseId: number;

  @ApiProperty()
  @IsHexadecimal()
  minter: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}
