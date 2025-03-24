import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftDocument } from './nft.schema';

export type CartDocument = Carts & Document;

@Schema({ timestamps: true })
export class Carts extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  nftContract: string;

  @Prop()
  tokenId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;
}

export const CartSchema = SchemaFactory.createForClass(Carts);
CartSchema.index({ user: 1 });
CartSchema.index({ user: 1, nftContract: 1, tokenId: 1 });
