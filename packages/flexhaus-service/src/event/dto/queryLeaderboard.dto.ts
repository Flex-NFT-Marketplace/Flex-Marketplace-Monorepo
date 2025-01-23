import { BaseQueryParams } from '@app/shared/types';
import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryLeaderboardDto extends BaseQueryParams {
  @ApiProperty()
  @IsMongoId()
  eventId: string;
}
