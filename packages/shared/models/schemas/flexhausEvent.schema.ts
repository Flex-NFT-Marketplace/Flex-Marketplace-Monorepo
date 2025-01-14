import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type FlexHausEventDocument = FlexHausEvents & Document;

@Schema({
  timestamps: true,
})
export class FlexHausEvents extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  creator: UserDocument;

  @Prop()
  perks: string;

  @Prop()
  startTime: number;

  @Prop()
  snapshotTime: number;

  @Prop({ default: false })
  isCancelled?: boolean;
}

export const flexHausEventSchema = SchemaFactory.createForClass(FlexHausEvents);
flexHausEventSchema.index({ creator: 1 });
flexHausEventSchema.index({ startTime: 1 });
flexHausEventSchema.index({ creator: 1, snapshotTime: 1, isCancelled: 1 });
