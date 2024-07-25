import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNumber } from 'class-validator';

export class GetCollectionDropPhaseDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty()
  @IsNumber()
  phaseId: number;
}
