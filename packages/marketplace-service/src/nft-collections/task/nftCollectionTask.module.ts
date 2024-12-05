import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftCollectionTaskService } from './nftCollectionTask.service';
import {
  Histories,
  HistorySchema,
  NftCollections,
  NftCollectionSchema,
  NftCollectionStats,
  NftCollectionStatsSchema,
  Nfts,
  NftSchema,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },

      {
        name: Nfts.name,
        schema: NftSchema,
      },

      {
        name: Histories.name,
        schema: HistorySchema,
      },

      {
        name: NftCollectionStats.name,
        schema: NftCollectionStatsSchema,
      },
    ]),
  ],
  providers: [NftCollectionTaskService],
})
export class NftCollectionTaskModule {}
