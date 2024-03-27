import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class UserBlacklist {
  @Prop()
  address: string;

  @Prop()
  updatedBy: string;
}

export const userBlacklistSchema = SchemaFactory.createForClass(UserBlacklist);
