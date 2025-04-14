import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { QuestType } from '@app/shared/types/enum.type';
import { ApiProperty } from '@nestjs/swagger';

export type QuestDocument = Quests & Document;

@Schema({ timestamps: true })
export class Quests extends BaseSchema {
  @Prop()
  @ApiProperty()
  title: string;

  @Prop()
  @ApiProperty()
  reward: number;

  @Prop({ type: SchemaTypes.String, enum: QuestType })
  @ApiProperty()
  type: QuestType;

  @Prop()
  @ApiProperty()
  amountOfTask: number;
}

export const QuestSchema = SchemaFactory.createForClass(Quests);
