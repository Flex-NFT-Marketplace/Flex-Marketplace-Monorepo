import { ApiProperty } from '@nestjs/swagger';

export class updateCollectionMetadataDto {
  @ApiProperty()
  nftContract: string;
}
