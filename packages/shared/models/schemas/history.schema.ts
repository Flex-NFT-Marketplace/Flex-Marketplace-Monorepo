import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftDocument } from './nft.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { UserDocument } from './user.schema';
import { SaleDocument } from './sale.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { ChainDocument } from './chain.schema';
import { HistoryType } from '../types';
import { OfferDocument } from './offer.schema';

export type HistoryDocument = Histories & Document;

@Schema({ timestamps: true })
export class Histories extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop({ type: SchemaTypes.Mixed })
  tokenId: number | string;

  @Prop()
  nftContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  from: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  to?: UserDocument;

  @Prop()
  amount: number;

  @Prop()
  price: number;

  @Prop()
  priceInUsd: number;

  @Prop()
  txHash: string;

  @Prop()
  index: number; // index of event in a transaction

  @Prop()
  timestamp: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chain' })
  chain: ChainDocument;

  @Prop({ type: SchemaTypes.String, enum: HistoryType })
  type: HistoryType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Sales' })
  sale?: SaleDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Offers' })
  offer?: OfferDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken?: PaymentTokenDocument;

  @Prop()
  point?: string;

  @Prop()
  phaseId?: number;
}

export const HistorySchema = SchemaFactory.createForClass(Histories);
HistorySchema.index({ nftContract: 1 });
HistorySchema.index({ nftContract: 1, tokenId: 1 });
HistorySchema.index({ nftContract: 1, phaseId: 1 });
HistorySchema.index(
  { nftContract: 1, tokenId: 1, txHash: 1, index: 1 },
  { unique: true },
);
HistorySchema.index({ from: 1 });
HistorySchema.index({ to: 1 });
HistorySchema.index({ nftContract: 1, type: 1, timestamp: 1 });
