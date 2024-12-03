import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsOptional } from 'class-validator';

export class GetFlexHausSetDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  collectible?: string;

  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  creator?: string;
}
