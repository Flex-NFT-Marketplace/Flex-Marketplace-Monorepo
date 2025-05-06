import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type SpinTicketDocument = SpinTicket & Document;

@Schema({ timestamps: true })
export class SpinTicket extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  amount: number;
}

export const SpinTicketSchema = SchemaFactory.createForClass(SpinTicket);
SpinTicketSchema.index({ user: 1 });
