import { ApiProperty } from '@nestjs/swagger';

export class PointPriceDto {
  @ApiProperty()
  strkPerPoint: string;
  @ApiProperty()
  ethPerPoint: string;
}
