import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes } from 'mongoose';
import { Attribute } from '../types';
import { BaseSchema } from './base.schema';

export type MetadataDocument = Metadata & Document;

@Schema()
export class Metadata extends BaseSchema {
  @Prop({ type: String, default: '' })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: '' })
  image: string;

  @Prop({ type: String, default: '' })
  external_url: string;

  @Prop({ type: SchemaTypes.Array })
  attributes: Attribute[];
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);
