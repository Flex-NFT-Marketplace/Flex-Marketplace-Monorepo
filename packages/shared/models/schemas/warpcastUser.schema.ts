import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NftCollectionDocument } from './nftcollection.schema';
import { DropPhaseDocument } from './dropphase.schema';
import { Document, SchemaTypes } from 'mongoose';

export type WarpcastUserDocument = WarpcastUsers & Document;

@Schema({ timestamps: true })
export class WarpcastUsers {
  @Prop()
  fid: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'DropPhases' })
  dropPhase: DropPhaseDocument;

  @Prop()
  txHash: string;
}

export const WarpcastUserSchema = SchemaFactory.createForClass(WarpcastUsers);
WarpcastUserSchema.index({ fid: 1 });
WarpcastUserSchema.index({ fid: 1, dropPhase: 1 });
