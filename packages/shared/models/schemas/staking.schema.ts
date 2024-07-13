import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { UserDocument } from './user.schema';

export type StakingDocument = Staking & Document;

@Schema({ timestamps: true })
export class Staking extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  nftContract: string;

  @Prop()
  tokenId: string;
}

export const StakingSchema = SchemaFactory.createForClass(Staking);
StakingSchema.index({ user: 1 });
