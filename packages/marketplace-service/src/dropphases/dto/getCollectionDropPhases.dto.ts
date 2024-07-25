import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class GetCollectionDropPhasesDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;
}
