import { Quest, QuestOption } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexadecimal,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class QuestDto implements Quest {
  @ApiProperty()
  @IsEnum(QuestOption)
  option: QuestOption;

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
  @IsString()
  warpcastImage: string;

  @ApiProperty()
  quests: QuestDto;

  @ApiProperty()
  @IsNumber()
  totalWarpcastMint: number;
}
