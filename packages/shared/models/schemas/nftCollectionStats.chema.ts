import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';

export class StatsDetail {
  @Prop()
  saleCount: number;

  @Prop()
  volume: number;

  @Prop()
  avgPrice: number;

  @Prop()
  volChange: number;
}

@Schema()
export class NftCollectionStats extends BaseSchema {
  @Prop({
    unique: true,
  })
  nftContract: string;

  @Prop()
  bestOffer: number;

  @Prop()
  nftCount: number;

  @Prop()
  ownerCount: number;

  @Prop()
  totalVolume: number;

  @Prop()
  totalListingCount: number;

  @Prop()
  floorPrice: number;

  @Prop({ type: StatsDetail })
  stats1D: StatsDetail;

  @Prop({ type: StatsDetail })
  stats7D: StatsDetail;

  @Prop()
  lastUpdated: number;
}

export type NftCollectionStatsDocument = NftCollectionStats & Document;
export const NftCollectionStatsSchema =
  SchemaFactory.createForClass(NftCollectionStats);
NftCollectionStatsSchema.index({ nftContract: 1 });
NftCollectionStatsSchema.index({ nftCollection: 1 });
