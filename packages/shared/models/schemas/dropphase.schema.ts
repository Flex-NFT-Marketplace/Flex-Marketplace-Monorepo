import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { ApiProperty } from '@nestjs/swagger';

export type DropPhaseDocument = DropPhases & Document;

export enum PhaseType {
  PublicMint = 'PublicMint',
  PrivateMint = 'PrivateMint',
}

export enum QuestOption {
  Like = 'Like',
  Follow = 'Follow',
  Recast = 'Recast',
  NFTHold = 'NFTHold',
  PoapHold = 'PoapHold',
}

export type Quest = {
  option: QuestOption;
  selection?: string;
};

export type WhitlistType = {
  address: string;
  isUsed: boolean;
};

@Schema({ timestamps: true })
export class DropPhases extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'NftCollections' })
  @ApiProperty()
  nftCollection: NftCollectionDocument;

  @Prop()
  @ApiProperty()
  phaseId: number;

  @Prop()
  @ApiProperty()
  mintPrice: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  @ApiProperty()
  paymentToken: PaymentTokenDocument;

  @Prop()
  @ApiProperty()
  startTime: number;

  @Prop()
  @ApiProperty()
  endTime: number;

  @Prop()
  @ApiProperty()
  updatedTime: number;

  @Prop()
  @ApiProperty()
  limitPerWallet: number;

  @Prop({ type: SchemaTypes.String, enum: PhaseType })
  @ApiProperty()
  phaseType: PhaseType;

  @Prop()
  @ApiProperty()
  farcasterFid?: number;

  @Prop()
  @ApiProperty()
  warpcastImage?: string;

  @Prop({ default: [] })
  @ApiProperty()
  quests?: Quest[];

  @Prop({ default: [] })
  @ApiProperty()
  whitelist?: WhitlistType[];

  @Prop({ default: 0 })
  @ApiProperty()
  totalWarpcastMint?: number;
}

export const DropPhaseSchema = SchemaFactory.createForClass(DropPhases);
