import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ROLE } from '@app/shared/constants';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = Users & Document;

export class Socials {
  @Prop()
  @ApiProperty()
  twitter?: string;

  @Prop()
  @ApiProperty()
  telegram?: string;

  @Prop()
  @ApiProperty()
  discord?: string;

  @Prop()
  @ApiProperty()
  website?: string;

  @Prop()
  @ApiProperty()
  warpcast?: string;
}

@Schema({
  timestamps: true,
})
export class Users extends BaseSchema {
  @Prop({ unique: true })
  username: string;

  @Prop()
  email?: string;

  @Prop()
  avatar?: string;

  @Prop()
  cover?: string;

  @Prop()
  about?: string;

  @Prop({ default: false })
  emailVerified?: boolean;

  @Prop({ required: true })
  address: string;

  @Prop()
  privateKey?: string;
  @Prop()
  deployHash?: string;

  @Prop({ type: SchemaTypes.UUID })
  nonce: string;

  @Prop()
  socials?: Socials;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop({ default: false })
  isCreatorPayer?: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  mappingAddress?: UserDocument;

  @Prop({ type: [SchemaTypes.String], enum: ROLE })
  roles: ROLE[];

  @Prop({ default: 0 })
  points?: number;

  @Prop({ default: 0 })
  flexPoint?: number;
}

export const UserSchema = SchemaFactory.createForClass(Users);
UserSchema.index({ address: 1 });
