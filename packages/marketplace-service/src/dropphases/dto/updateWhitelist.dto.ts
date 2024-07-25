import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNumber } from 'class-validator';

export class UpdateWhitelistMintDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty()
  @IsNumber()
  phaseId: number;

  @ApiProperty()
  @IsHexadecimal({ each: true })
  whitelist: string[];
}
