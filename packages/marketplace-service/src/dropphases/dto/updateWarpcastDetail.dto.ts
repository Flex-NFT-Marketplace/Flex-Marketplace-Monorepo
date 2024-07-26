import { Quest, QuestOption } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexadecimal,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class QuestDto implements Quest {
  @ApiProperty({ enum: QuestOption })
  @IsEnum(QuestOption)
  option: QuestOption;

  @ApiProperty()
  @IsString()
  @IsOptional()
  selection?: string;
}

export class UpdateWarpcastDetailDto {
  @ApiProperty()
  @IsHexadecimal()
  nftContract: string;

  @ApiProperty()
  @IsNumber()
  phaseId: number;

  @ApiProperty()
  @IsNumber()
  totalWarpcastMint: number;

  @ApiProperty()
  @IsOptional()
  quests?: QuestDto[];

  @ApiProperty()
  @IsNumber()
  farcasterFid: number;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  warpcastImage?: string;
}
