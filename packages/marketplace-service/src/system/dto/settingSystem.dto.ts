import { IsHexStringArray } from '@app/shared/helper/isHexString';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize } from 'class-validator';
export class SettingBannerCollectionDto {
  @ApiProperty({
    description: 'Array of NFT collection banners',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1) // Ensure at least one banner exists
  @IsHexStringArray() // Custom decorator for hex string validation
  nftCollectionBanner: string[];
}
