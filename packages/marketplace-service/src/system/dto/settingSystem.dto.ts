import { IsHexStringArray } from '@app/shared/helper/isHexString';
import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize } from 'class-validator';
export class SettingBannerCollectionDto {
  @ApiProperty({
    description: 'Array of NFT collection banners',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1) // Ensure at least one banner exists
  @IsHexStringArray()
  nftCollectionBanner: string[];
}

export class SettingBannerCollectionQueryDto extends BaseQueryParams {}
