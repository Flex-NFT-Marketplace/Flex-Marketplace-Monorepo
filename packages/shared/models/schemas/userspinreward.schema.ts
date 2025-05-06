import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { SpinRewardDocument } from './spinreward.schema';

export type UserSpinRewardDocument = UserSpinRewards & Document;

@Schema({ timestamps: true })
export class UserSpinRewards extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'SpinRewards' })
  reward: SpinRewardDocument;

  @Prop({ default: false })
  isClaimed?: boolean;
}

export const UserSpinRewardSchema =
  SchemaFactory.createForClass(UserSpinRewards);
UserSpinRewardSchema.index({ user: 1 });
UserSpinRewardSchema.index({ isClaimed: 1 });
