import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { QuestDocument } from './quests.schema';
import { UserDocument } from './user.schema';

export type QuestProcessDocument = QuestProcess & Document;

@Schema({ timestamps: true })
export class QuestProcess extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Quests' })
  quest: QuestDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  processOfTask: number;

  @Prop()
  isVerified: boolean;

  @Prop({ default: false })
  isClaimed?: boolean;

  @Prop()
  processTime: number;
}

export const questProcessSchema = SchemaFactory.createForClass(QuestProcess);
questProcessSchema.index({ user: 1 });
questProcessSchema.index({ user: 1, quest: 1 });
questProcessSchema.index({ user: 1, quest: 1, processTime: 1 });
