import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { PaymentTokenDocument } from './paymenttoken.schema';

export type CoinPriceDocument = CoinPrice & Document;

@Schema({ timestamps: true })
export class CoinPrice extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  token0: PaymentTokenDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  token1: PaymentTokenDocument;

  @Prop()
  price: string;

  @Prop()
  timestamp: number;
}

export const CoinPriceSchema = SchemaFactory.createForClass(CoinPrice);
CoinPriceSchema.index({ token0: 1, token1: 1, timestamp: 1 });
CoinPriceSchema.index({ token0: 1, timestamp: 1 });
