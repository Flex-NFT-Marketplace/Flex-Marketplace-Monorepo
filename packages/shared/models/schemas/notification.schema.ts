import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftDocument } from './nft.schema';
import { NotificationStatus } from '../types';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type NotificationDocument = Notifications & Document;

@Schema({ timestamps: true })
export class Notifications extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Nfts' })
  nft: NftDocument;

  @Prop()
  content: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  txHash: string;

  @Prop({
    type: SchemaTypes.String,
    enum: NotificationStatus,
    default: NotificationStatus.UnSeen,
  })
  status?: NotificationStatus;
}
