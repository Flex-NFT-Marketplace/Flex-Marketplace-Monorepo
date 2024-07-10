import { ApiProperty } from '@nestjs/swagger';

export class updateCollectionMetadataDto {
  @ApiProperty()
  nftContract: string;

  @ApiProperty({
    default: false,
    description:
      'If IsNew is true, It will update all metadata of all tokens. Else update missing metadata.',
  })
  isNew?: boolean = true;
}
