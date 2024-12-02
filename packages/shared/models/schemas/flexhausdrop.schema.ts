import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.schema';
import { FlexHausSet, FlexHausSetDocument } from './flexhausset.schema';

export type FlexHausDropDocument = FlexHausDrop & Document;

@Schema({ timestamps: true })
export class FlexHausDrop extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  collectible: NftCollectionDocument;

  @Prop()
  dropType: number;

  @Prop()
  secureAmount: string;

  @Prop()
  topSupporters: number;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'FlexHausSet' })
  set: FlexHausSetDocument;
}

export const FlexHausDropSchema = SchemaFactory.createForClass(FlexHausDrop);
