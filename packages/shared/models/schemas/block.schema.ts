import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum BlockStatus {
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

  @Prop({ enum: BlockStatus })
  status: BlockStatus;

  @Prop()
  timestamp: number;
}

export const BlockSchema = SchemaFactory.createForClass(Blocks);
