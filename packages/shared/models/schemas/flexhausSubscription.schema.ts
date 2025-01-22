import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type FlexHausSubscriptionDocument = FlexHausSubscription & Document;

@Schema({
  timestamps: true,
})
export class FlexHausSubscription extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  creator: UserDocument;

  @Prop({ default: false })
  isUnSubscribe?: boolean;
}

export const flexHausSubscriptionSchema =
  SchemaFactory.createForClass(FlexHausSubscription);

flexHausSubscriptionSchema.index({ user: 1 });
flexHausSubscriptionSchema.index({ creator: 1 });
flexHausSubscriptionSchema.index({ creator: 1, isUnSubscribe: 1 });
