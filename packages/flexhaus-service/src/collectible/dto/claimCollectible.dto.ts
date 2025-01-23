import { ApiProperty } from '@nestjs/swagger';

export class ClaimCollectibleDto {
  @ApiProperty()
  collectible: string;

  @ApiProperty()
  user: string;

  @ApiProperty()
  signature: string[];
}
