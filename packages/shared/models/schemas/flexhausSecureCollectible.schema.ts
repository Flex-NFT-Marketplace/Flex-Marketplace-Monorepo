import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftCollectionDocument } from './nftcollection.schema';

export type FlexHausSecureCollectibleDocument = FlexHausSecureCollectible &
  Document;

@Schema({ timestamps: true })
export class FlexHausSecureCollectible extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  collectible: NftCollectionDocument;

  @Prop()
  isSecured: boolean;

  @Prop({ default: false })
  isDistributed?: boolean;

  @Prop({ default: false })
  isClaimed?: boolean;
}

export const FlexHausSecureCollectibleSchema = SchemaFactory.createForClass(
  FlexHausSecureCollectible,
);
FlexHausSecureCollectibleSchema.index({ user: 1 });
FlexHausSecureCollectibleSchema.index({ collectible: 1 });
FlexHausSecureCollectibleSchema.index({ collectible: 1, user: 1 });
FlexHausSecureCollectibleSchema.index({
  collectible: 1,
  user: 1,
  isSecured: 1,
});
FlexHausSecureCollectibleSchema.index({ user: 1, isClaimed: 1 });
