import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class QuerySubscriberDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  creator: string;
}
