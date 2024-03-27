import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { ChainDocument } from './chain.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { NftCollectionStandard, NftCollectionStatus } from '../types';
import { Document, SchemaTypes } from 'mongoose';

export type NftCollectionDocument = NftCollections & Document;

@Schema({ timestamps: true })
export class NftCollections extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop()
  key: string;

  @Prop()
  nftContract: string;

  @Prop()
  cover?: string;

  @Prop()
  avatar?: string;

  @Prop()
  featuredImage?: string;

  @Prop()
  description?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  owner: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chains' })
  chain: ChainDocument;

  @Prop({ type: SchemaTypes.String, enum: NftCollectionStandard })
  standard: NftCollectionStandard;

  @Prop({ type: SchemaTypes.DocumentArray, ref: 'PaymentTokens' })
  paymentTokens: PaymentTokenDocument[];

  @Prop({
    type: SchemaTypes.String,
    enum: NftCollectionStatus,
    default: NftCollectionStatus.Active,
  })
  status?: NftCollectionStatus;

  @Prop({ default: false })
  verified?: boolean;

  @Prop()
  royaltyRate?: number;

  @Prop({ type: SchemaTypes.DocumentArray, ref: 'Users' })
  collaboratories: UserDocument[];
}

export const NftCollectionSchema = SchemaFactory.createForClass(NftCollections);
NftCollectionSchema.index({ nftContract: 1 }, { unique: true });
