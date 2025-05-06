import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { SpinRewardType } from '@app/shared/types/enum.type';

export type SpinRewardDocument = SpinRewards & Document;

@Schema({ timestamps: true })
export class SpinRewards extends BaseSchema {
  @Prop({ type: SchemaTypes.String, enum: SpinRewardType })
  reward: SpinRewardType;

  @Prop()
  amount: number;

  @Prop()
  percentage: number;
}

export const SpinRewardSchema = SchemaFactory.createForClass(SpinRewards);
