import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { SpinRewardDocument } from './spinreward.schema';
import { Document, SchemaTypes } from 'mongoose';

export type SpinHistoryDocument = SpinHistory & Document;

@Schema({
  timestamps: true,
})
export class SpinHistory extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'SpinRewards' })
  reward: SpinRewardDocument;
}

export const SpinHistorySchema = SchemaFactory.createForClass(SpinHistory);
SpinHistorySchema.index({ user: 1 });
SpinHistorySchema.index({ user: 1, reward: 1 });
