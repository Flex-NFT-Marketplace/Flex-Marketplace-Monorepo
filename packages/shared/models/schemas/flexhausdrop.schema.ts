import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { SchemaTypes, Document } from 'mongoose';
import { BaseSchema } from './base.schema';
import { FlexHausSetDocument } from './flexhausset.schema';
import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from './user.schema';

export type FlexHausDropDocument = FlexHausDrop & Document;

@Schema({ timestamps: true })
export class FlexHausDrop extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  @ApiProperty()
  collectible: NftCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  @ApiProperty()
  creator: UserDocument;

  @Prop()
  @ApiProperty()
  dropType: number;

  @Prop()
  @ApiProperty()
  secureAmount: string;

  @Prop()
  @ApiProperty()
  topSupporters: number;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'FlexHausSet' })
  @ApiProperty()
  set?: FlexHausSetDocument;
}

export const FlexHausDropSchema = SchemaFactory.createForClass(FlexHausDrop);
