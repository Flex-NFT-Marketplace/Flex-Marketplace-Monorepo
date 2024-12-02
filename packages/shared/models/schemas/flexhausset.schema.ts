import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftCollectionDocument } from './nftcollection.schema';
import { SchemaTypes } from 'mongoose';

export type FlexHausSetDocument = FlexHausSet & Document;

@Schema({ timestamps: true })
export class FlexHausSet extends BaseSchema {
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'NftCollections' })
  collectibles: NftCollectionDocument[];

  @Prop()
  startTime: number;
}

export const FlexHausSetSchema = SchemaFactory.createForClass(FlexHausSet);
