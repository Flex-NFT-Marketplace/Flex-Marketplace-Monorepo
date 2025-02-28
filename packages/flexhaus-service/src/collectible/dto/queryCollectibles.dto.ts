import { BaseQueryParams } from '@app/shared/types';
import { IsOptional, IsHexadecimal, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FilterDrops } from '@app/shared/types/enum.type';

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

  @ApiProperty()
  @IsEnum(FilterDrops)
  @IsOptional()
  filterBy?: FilterDrops;
}
