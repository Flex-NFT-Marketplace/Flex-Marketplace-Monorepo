import { HistoryType } from '@app/shared/models';
import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsHexadecimal,
  Length,
  IsOptional,
  IsArray,
} from 'class-validator';

export class QueryHistoriesDto extends BaseQueryParams {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  tokenId: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsHexadecimal()
  @Length(66, 66)
  nftContract: string;

  @ApiProperty({ required: false, nullable: true })
  @IsHexadecimal()
  @Length(66, 66)
  @IsOptional()
  userAddress: string;

  @ApiProperty({
    required: false,
    nullable: true,
    enum: HistoryType,
  })
  @IsArray()
  @IsOptional()
  types: HistoryType[];
}
