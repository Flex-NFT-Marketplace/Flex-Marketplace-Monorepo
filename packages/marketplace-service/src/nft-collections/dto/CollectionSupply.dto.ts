import { ApiProperty } from '@nestjs/swagger';

export class NFTCollectionSuply {
  @ApiProperty()
  owners: number;

  @ApiProperty()
  supply: number;
}
