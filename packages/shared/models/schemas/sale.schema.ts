import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftDocument } from './nft.schema';
import { NftCollectionDocument } from './nftcollection.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { MarketStatus } from '../types';
import { Document, SchemaTypes } from 'mongoose';
import { UserDocument } from './user.schema';

export type SaleDocument = Sales & Document;

@Schema({ timestamps: true })
export class Sales extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  signer: UserDocument;

  @Prop()
  tokenId: number;

  @Prop()
  nftContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: NftCollectionDocument;

  @Prop()
  signedSignature: string[];

  @Prop()
  saltNonce: number;

  @Prop()
  startTime: number;

  @Prop()
  endTime: number;

  @Prop()
  price: number;

  @Prop()
  amount: number;

  @Prop()
  remainingAmount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken: PaymentTokenDocument;

  @Prop({ type: SchemaTypes.String, enum: MarketStatus })
  status: MarketStatus;

  @Prop()
  blockTime: number;
}

export const SaleSchema = SchemaFactory.createForClass(Sales);
SaleSchema.index({ nftContract: 1, tokenId: 1 });
SaleSchema.index({ nftContract: 1, tokenId: 1, saltNonce: 1 });
SaleSchema.index({ seller: 1, saltNonce: 1 });
