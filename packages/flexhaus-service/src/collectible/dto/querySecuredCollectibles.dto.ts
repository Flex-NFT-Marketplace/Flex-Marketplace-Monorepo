import { BaseQueryParams } from '@app/shared/types';
import { IsOptional, IsHexadecimal, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSecuredCollectiblesDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  collectible?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isDistributed?: boolean;
}
