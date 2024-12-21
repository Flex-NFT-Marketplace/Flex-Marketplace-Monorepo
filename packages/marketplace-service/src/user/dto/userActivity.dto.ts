import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';

import { SignStatusEnum } from '@app/shared/models';

export class QueryUserActivity extends BaseQueryParams {
  @ApiProperty()
  @IsString()
  userAddress: string;

  @ApiProperty()
  @IsEnum(SignStatusEnum)
  status: SignStatusEnum;
}
