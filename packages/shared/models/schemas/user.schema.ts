import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from './base.schema';

export type UserDocument = Users & Document;

export class Socials {
  facebook: string;
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
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
  nonce: number;

  @Prop()
  socials?: Socials;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop()
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(Users);
