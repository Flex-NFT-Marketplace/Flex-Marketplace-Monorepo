import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { BaseQueryParams } from '@app/shared/types';
import { NftCollections, Nfts } from '@app/shared/models';

export class SearchQueryDto extends BaseQueryParams {
  @ApiProperty()
  @IsString()
  search: string;
}

export class NftSearchResponseDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  nftContract: string;

  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  royaltyRate: number;

  @ApiProperty()
  image?: string;

  @ApiProperty()
  originalImage?: string;

  @ApiProperty()
  animationUrl?: string;

  @ApiProperty()
  animationPlayType?: string;

  @ApiProperty()
  externalUrl?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  tokenUri?: string;

  static from(nft: Nfts): NftSearchResponseDto {
    return {
      name: nft.name,
      nftContract: nft.nftContract,
      tokenId: nft.tokenId.toString(),
      royaltyRate: nft.royaltyRate,
      image: nft.image,
      originalImage: nft.originalImage,
      animationUrl: nft.animationUrl,
      animationPlayType: nft.animationPlayType,
      externalUrl: nft.externalUrl,
      description: nft.description,
      tokenUri: nft.tokenUri,
    };
  }
}

export class NftCollectionResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  cover?: string;

  @ApiProperty()
  standard: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  nftContract: string;

  @ApiProperty()
  featuredImage?: string;

  static from(collection: NftCollections): NftCollectionResponseDto {
    return {
      name: collection.name,
      description: collection.description,
      cover: collection.cover,
      standard: collection.standard,
      nftContract: collection.nftContract,
      avatar: collection.avatar,
      featuredImage: collection.featuredImage,
    };
  }
}
