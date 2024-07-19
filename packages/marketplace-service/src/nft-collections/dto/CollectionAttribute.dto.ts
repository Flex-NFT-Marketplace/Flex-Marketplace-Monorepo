import { ApiProperty } from '@nestjs/swagger';

export class AttributeOptionsDto {
  @ApiProperty()
  value: string | number | boolean;

  @ApiProperty()
  total: number;

  @ApiProperty()
  rarity: number;
}

export class NftCollectionAttributeDto {
  @ApiProperty()
  trait_type: string;

  @ApiProperty({ type: [AttributeOptionsDto] })
  options: AttributeOptionsDto[];
}
