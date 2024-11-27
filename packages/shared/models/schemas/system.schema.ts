import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.schema';
import { NftCollectionDocument } from './nftcollection.schema';

export type SystemDocument = System & Document;

@Schema({
  timestamps: true,
})
export class System extends BaseSchema {
  @Prop()
  name?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'nftCollections' })
  nftCollectionBanner?: NftCollectionDocument[];

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'nftCollections',
  })
  nftCollectionTrending?: NftCollectionDocument[];
}

export const SystemSchema = SchemaFactory.createForClass(System);
