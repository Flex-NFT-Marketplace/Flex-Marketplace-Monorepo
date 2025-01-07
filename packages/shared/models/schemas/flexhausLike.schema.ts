import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftCollectionDocument } from './nftcollection.schema';

export type FlexHausLikeDocument = FlexHausLike & Document;

@Schema({ timestamps: true })
export class FlexHausLike extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  collectible: NftCollectionDocument;

  @Prop({ default: false })
  isUnLike?: boolean;
}

export const FlexHausLikeSchema = SchemaFactory.createForClass(FlexHausLike);
FlexHausLikeSchema.index({ user: 1 });
FlexHausLikeSchema.index({ collectible: 1 });
FlexHausLikeSchema.index({ collectible: 1, isUnLike: 1 });
FlexHausLikeSchema.index({ user: 1, collectible: 1 });
