import { BaseQueryParams } from '@app/shared/types';
import { IsBoolean, IsHexadecimal, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryEventsDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  creator?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isCancelled?: boolean;
}
