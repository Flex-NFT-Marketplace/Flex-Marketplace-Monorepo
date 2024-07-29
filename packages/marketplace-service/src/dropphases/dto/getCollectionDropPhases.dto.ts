import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsOptional, IsEnum } from 'class-validator';

export enum DropPhaseType {
  LiveNow = 'LiveNow',
  UpComming = 'UpComming',
  Ended = 'Ended',
}

export class GetCollectionDropPhasesDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  nftContract?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(DropPhaseType)
  dropPhaseType?: DropPhaseType;
}
