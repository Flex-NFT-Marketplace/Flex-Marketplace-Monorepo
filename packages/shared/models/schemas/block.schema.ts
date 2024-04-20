import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Blocks & Document;

export enum BlockWorkerStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

export class BLockTx {
  @Prop({ index: true })
  hash: string;
}

@Schema({ timestamps: true })
export class Blocks {
  @Prop({ index: true })
  blockNumber: number;

  @Prop()
  chain: string;

  @Prop()
  transactions: BLockTx[];

  @Prop({ enum: BlockWorkerStatus })
  status: BlockWorkerStatus;

  @Prop()
  timestamp: number;
}

export const BlockSchema = SchemaFactory.createForClass(Blocks);
