import { QuestDocument, UserDocument } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';

export class QuestProcessDto {
  @ApiProperty()
  quest: QuestDocument;

  @ApiProperty()
  processOfTask: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isClaimed: boolean;

  @ApiProperty()
  processTime: number;
}
