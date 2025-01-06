import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type FlexHausPaymentDocument = FlexHausPayment & Document;

@Schema({ timestamps: true })
export class FlexHausPayment extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  address: string;

  @Prop()
  privateKey: string;

  @Prop()
  deadline: number;
}

export const FlexHausPaymentSchema =
  SchemaFactory.createForClass(FlexHausPayment);
FlexHausPaymentSchema.index({ address: 1 });
FlexHausPaymentSchema.index({ user: 1 });
FlexHausPaymentSchema.index({ user: 1, deadline: 1 });
FlexHausPaymentSchema.index({ address: 1, deadline: 1 });
FlexHausPaymentSchema.index({ deadline: -1 });
