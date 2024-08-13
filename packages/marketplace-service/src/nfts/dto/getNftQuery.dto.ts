import {
  IsString,
  IsHexadecimal,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetNftQueryDto {
  @ApiProperty({ required: true })
  @IsHexadecimal()
  @IsNotEmpty()
  nftContract: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  tokenId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsHexadecimal()
  @IsNotEmpty()
  owner?: string;
}
