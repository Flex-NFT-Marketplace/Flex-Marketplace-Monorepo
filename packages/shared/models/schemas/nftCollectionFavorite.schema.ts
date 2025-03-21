import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { UserDocument } from './user.schema';

export type NftCollectionFavoritesDocument = NftCollectionFavorites & Document;

@Schema({ timestamps: true })
export class NftCollectionFavorites extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: string;

  @Prop({ type: SchemaTypes.String, default: false })
  isUnFavorite?: boolean;
}

export const NftCollectionFavoritesSchema = SchemaFactory.createForClass(
  NftCollectionFavorites,
);
NftCollectionFavoritesSchema.index(
  { user: 1, nftCollection: 1 },
  { unique: true },
);
