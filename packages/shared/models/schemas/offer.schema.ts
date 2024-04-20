import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftDocument } from './nft.schema';
import { NftCollectionDocument } from './nftcollection.schema';
import { UserDocument } from './user.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { OfferStatus } from '../types';
import { Document, SchemaTypes } from 'mongoose';

export type OfferDocument = Offers & Document;

@Schema({ timestamps: true })
export class Offers extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop()
  tokenId: number;

  @Prop()
  nftContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  nftCollection: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  buyer: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  seller: UserDocument;

  @Prop()
  signedSignature: string[];

  @Prop()
  saltNonce: number;

  @Prop()
  startTime: number;

  @Prop()
  endTime: number;

  @Prop()
  offerPrice: number;

  @Prop()
  amount: number;

  @Prop()
  remainingAmount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken: PaymentTokenDocument;

  @Prop({ type: SchemaTypes.String, enum: OfferStatus })
  status: OfferStatus;

  @Prop()
  blockTime: number;
}

export const OfferSchema = SchemaFactory.createForClass(Offers);
OfferSchema.index({ nftContract: 1, tokenId: 1 });
OfferSchema.index({ nftContract: 1, tokenId: 1, saltNonce: 1 });
