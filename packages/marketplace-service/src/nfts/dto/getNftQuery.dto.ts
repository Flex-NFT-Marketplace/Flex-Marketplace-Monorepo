import { IsString, IsHexadecimal, IsNotEmpty } from 'class-validator';
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
}
