import { ExternalLink } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsString, IsUrl, IsOptional } from 'class-validator';

export class ExternalLinkDto implements ExternalLink {
  @IsUrl()
  @IsOptional()
  @ApiProperty()
  discord?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty()
  x?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty()
  website?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty()
  warpcastProfile?: string;
}

export class UpdateCollectionDetailDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty()
  @IsUrl()
  cover?: string;

  @ApiProperty()
  @IsUrl()
  avatar?: string;

  @ApiProperty()
  @IsString()
  description?: string;

  @ApiProperty()
  externalLink?: ExternalLinkDto;
}
