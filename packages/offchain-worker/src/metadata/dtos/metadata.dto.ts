export class MetaDataDto {
  name?: string;
  description?: string;
  image?: string;
  attributes?: {
    trait_type: string;
    value: any;
    display_type?: string;
  }[];
  externalUrl?: string;
  animation_url?: string;
  youtube_url?: string;
}
