import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { SchemaTypes, Document } from 'mongoose';
import { BaseSchema } from './base.schema';
import { FlexHausSetDocument } from './flexhausset.schema';
import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from './user.schema';
import { FlexHausDropType } from '../types';

export type FlexHausDropDocument = FlexHausDrop & Document;

@Schema({ timestamps: true })
export class FlexHausDrop extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  @ApiProperty()
  collectible: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  @ApiProperty()
  creator: UserDocument;

  @Prop({ type: SchemaTypes.String, enum: FlexHausDropType })
  @ApiProperty()
  dropType: FlexHausDropType;

  @Prop()
  @ApiProperty()
  secureAmount: number;

  @Prop()
  @ApiProperty()
  fromTopSupporter: number;

  @Prop()
  @ApiProperty()
  toTopSupporter: number;

  @Prop()
  @ApiProperty()
  isRandomToSubscribers: boolean;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'FlexHausSet' })
  @ApiProperty()
  set?: FlexHausSetDocument;
}

export const FlexHausDropSchema = SchemaFactory.createForClass(FlexHausDrop);
FlexHausDropSchema.index({ collectible: 1 });
FlexHausDropSchema.index({ collectible: 1, set: 1 });
