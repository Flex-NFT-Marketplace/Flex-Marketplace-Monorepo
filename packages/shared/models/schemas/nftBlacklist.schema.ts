import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NftDocument } from './nft.schema';
import { UserDocument } from './user.schema';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class NftBlacklists {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  updateBy: UserDocument;
}

export const NftBlacklistSchema = SchemaFactory.createForClass(NftBlacklists);
