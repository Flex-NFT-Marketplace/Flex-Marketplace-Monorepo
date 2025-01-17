import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { FlexHausEventDocument } from './flexhausEvent.schema';
import { ApiProperty } from '@nestjs/swagger';

export type FlexHausDonateDocument = FlexHausDonates & Document;

@Schema({ timestamps: true })
export class FlexHausDonates extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  @ApiProperty()
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  @ApiProperty()
  creator: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'FlexHausEvents' })
  @ApiProperty()
  event: FlexHausEventDocument;

  @Prop()
  @ApiProperty()
  amount: number;

  @Prop()
  donatedAt: number;
}

export const flexHausDonateSchema =
  SchemaFactory.createForClass(FlexHausDonates);
flexHausDonateSchema.index({ user: 1 });
flexHausDonateSchema.index({ creator: 1 });
flexHausDonateSchema.index({ event: 1 });
