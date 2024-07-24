import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';

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
  nftCollection: NftCollectionDocument;

  @Prop()
  phaseId: number;

  @Prop()
  mintPrice: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken: PaymentTokenDocument;

  @Prop()
  startTime: number;

  @Prop()
  endTime: number;

  @Prop()
  updatedTime: number;

  @Prop()
  limitPerWallet: number;

  @Prop({ type: SchemaTypes.String, enum: PhaseType })
  phaseType: PhaseType;

  @Prop()
  farcasterFid?: number;

  @Prop()
  quests?: Quest[];

  @Prop()
  whitelist?: WhitlistType[];
}

export const DropPhaseSchema = SchemaFactory.createForClass(DropPhases);
