import { IsMongoId } from 'class-validator';

export class VerifyQuestProcessDto {
  @IsMongoId()
  questId: string;
}
