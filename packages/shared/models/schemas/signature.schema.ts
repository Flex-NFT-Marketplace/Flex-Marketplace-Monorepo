import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SignatureDocument = HydratedDocument<Signature>;

export enum SignStatusEnum {
  LISTING = 'LISTING',
  BUYING = 'BUYING',
  SOLD = 'SOLD',
  BID = 'BID',
  CANCEL = 'CANCEL',
  ORDER_CANCEL = 'ORDER_CANCEL',
  REVERTED = 'REVERTED',
  BIDDING = 'BIDDING',
}

export type SignStatus =
  | SignStatusEnum.BID
  | SignStatusEnum.BUYING
  | SignStatusEnum.CANCEL
  | SignStatusEnum.LISTING
  | SignStatusEnum.SOLD
  | SignStatusEnum.ORDER_CANCEL
  | SignStatusEnum.REVERTED
  | SignStatusEnum.BIDDING;

export enum TxStatusEnum {
  REVERTED = 'REVERTED',
  PENDING = 'PENDING',
  ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
  ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1',
}

export type TxStatus =
  | TxStatusEnum.ACCEPTED_ON_L1
  | TxStatusEnum.ACCEPTED_ON_L2
  | TxStatusEnum.PENDING
  | TxStatusEnum.REVERTED;

@Schema({ timestamps: true })
export class Signature {
  @Prop({ index: true })
  contract_address: string;

  @Prop({ index: true })
  token_id: string;

  @Prop()
  signature4: string;

  @Prop()
  paymentToken: string;

  @Prop()
  nonce: number;

  @Prop()
  price: number;

  @Prop()
  amount: number;

  @Prop()
  amount_sig: number;

  @Prop({ default: SignStatusEnum.LISTING, enum: SignStatusEnum })
  status: SignStatus;

  @Prop()
  transaction_hash: string;

  @Prop({ default: TxStatusEnum.PENDING, enum: TxStatusEnum })
  transaction_status: TxStatus;

  @Prop()
  sell_end: number;

  @Prop({ index: true }) // Adding an index on signer
  signer: string;

  @Prop()
  buyer_address: string;

  @Prop({ type: Types.ObjectId, ref: 'Nfts' })
  nft: Types.ObjectId;

  @Prop()
  currency: string;

  @Prop()
  is_burned?: boolean;
  @Prop()
  is_burned_tx_hash?: string;
}

export const SignatureSchema = SchemaFactory.createForClass(Signature);
SignatureSchema.index({ contract_address: 1, token_id: 1 });
SignatureSchema.index({ signer: 1, status: 1 });
SignatureSchema.index({ status: 1 });
SignatureSchema.index({ price: -1, createdAt: -1 });
SignatureSchema.index({ price: 1, createdAt: -1 });
