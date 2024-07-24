import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Blocks & Document;

export enum BlockWorkerStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

export enum TransactionWorkerStatus {
  PENDING = 0,
  SUCCESS = 1,
}

export type TransactionWorkerType = {
  txHash: string;
  status: TransactionWorkerStatus;
};

@Schema()
export class Blocks {
  @Prop({ index: true })
  blockNumber: number;

  @Prop({ index: true })
  chain: string;

  @Prop()
  transactions: TransactionWorkerType[];

  @Prop()
  status: BlockWorkerStatus;

  @Prop()
  timestamp: number;
}

export const BlockSchema = SchemaFactory.createForClass(Blocks);
