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

export type HistoryDocument = Histories & Document;

@Schema({ timestamps: true })
export class Histories extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop()
  tokenId: number;

  @Prop()
  nftContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  from: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  to: UserDocument;

  @Prop()
  price: number;

  @Prop()
  priceInUsd: number;

  @Prop()
  block: number;

  @Prop()
  timestamp: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chain' })
  chain: ChainDocument;

  @Prop({ type: SchemaTypes.String, enum: HistoryType })
  type: HistoryType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Sales' })
  sale?: SaleDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken?: PaymentTokenDocument;
}

export const HistorySchema = SchemaFactory.createForClass(Histories);
HistorySchema.index({ nftContract: 1, tokenId: 1 });
