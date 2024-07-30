import { ExternalLink } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsString, IsUrl, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsOptional()
  cover?: string;

  @ApiProperty()
  @IsUrl()
  @IsOptional()
  avatar?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => ExternalLinkDto)
  externalLink?: ExternalLinkDto;
}
