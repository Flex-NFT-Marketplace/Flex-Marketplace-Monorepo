import { BaseQueryParams } from '@app/shared/types';
import { IsOptional, IsHexadecimal, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCollectiblesDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  collectible?: string;

  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  creator?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isHaveSet?: boolean;
}
