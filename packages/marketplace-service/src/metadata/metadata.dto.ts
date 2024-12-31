import { IsEmail, IsNotEmpty } from 'class-validator';

class AttributesDTO {
  trait_type: string;
  value: string;
}

export class MetadataDTO {
  @IsNotEmpty()
  name: string;

  description: string;

  external_url: string;

  attributes: AttributesDTO;
}
