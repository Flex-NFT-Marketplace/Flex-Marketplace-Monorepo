import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftCollectionDocument } from './nftcollection.schema';
import { UserDocument } from './user.schema';
import { Attribute, MarketType } from '../types';
import { Document, SchemaTypes } from 'mongoose';
import { ChainDocument } from './chain.schema';
import { SaleDocument } from './sale.schema';

export type NftDocument = Nfts & Document;

@Schema({ timestamps: true })
export class Nfts extends BaseSchema {
  @Prop({ type: SchemaTypes.Mixed })
  tokenId: number | string;

  @Prop()
  nftContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chains' })
  chain: ChainDocument;

  @Prop()
  blockTime: number;

  @Prop()
  royaltyRate: number;

  @Prop()
  name?: string;

  @Prop()
  image?: string;

  @Prop()
  originalImage?: string;

  @Prop()
  animationUrl?: string;

  @Prop()
  animationPlayType?: string;

  @Prop()
  externalUrl?: string;

  @Prop()
  description?: string;

  @Prop()
  tokenUri?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  creator: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  owner: UserDocument;

  @Prop()
  amount: number;

  @Prop({ type: SchemaTypes.Array })
  attributes?: Attribute[];

  @Prop({ type: SchemaTypes.String, enum: MarketType })
  marketType: MarketType;

  @Prop({ default: false })
  isBurned?: boolean;

  @Prop()
  burnedAt?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Sales' })
  sale?: SaleDocument;
}

export const NftSchema = SchemaFactory.createForClass(Nfts);
NftSchema.index({ nftContract: 1, tokenId: 1 });
NftSchema.index({ owner: 1 });
NftSchema.index({ nftContract: 1, isBurned: 1 });
NftSchema.index({ nftCollection: 1, isBurned: 1 });
NftSchema.index({ nftContract: 1, tokenId: 1, isBurned: 1 });
NftSchema.index({ 'attributes.value': 1, 'attributes.trait_type': 1 });
NftSchema.index({ nftContract: 1, tokenId: 1, owner: 1 }, { unique: true });
