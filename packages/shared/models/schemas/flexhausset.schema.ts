import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { NftCollectionDocument } from './nftcollection.schema';
import { SchemaTypes, Document } from 'mongoose';
import { UserDocument } from './user.schema';
import { ApiProperty } from '@nestjs/swagger';
import { FlexHausEventDocument } from './flexhausEvent.schema';

export type FlexHausSetDocument = FlexHausSet & Document;

@Schema({ timestamps: true })
export class FlexHausSet extends BaseSchema {
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'NftCollections' })
  @ApiProperty()
  collectibles: NftCollectionDocument[];

  @Prop()
  @ApiProperty()
  startTime: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  @ApiProperty()
  creator: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'FlexHausEvents' })
  @ApiProperty()
  event: FlexHausEventDocument;
}

export const FlexHausSetSchema = SchemaFactory.createForClass(FlexHausSet);
