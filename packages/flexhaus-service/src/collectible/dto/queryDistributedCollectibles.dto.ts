import { BaseQueryParams } from '@app/shared/types';
import { IsOptional, IsHexadecimal, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDistributedCollectiblesDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  collectible?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isClaimed?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isSecured?: boolean;

  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  user?: string;
}
