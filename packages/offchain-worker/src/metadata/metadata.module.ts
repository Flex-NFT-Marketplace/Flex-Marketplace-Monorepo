import {
  ChainSchema,
  Chains,
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
} from '@app/shared/models';
import { QUEUE_METADATA } from '@app/shared/types';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataService } from './metadata.service';
import { FetchMetadataProcessor } from './queue/fetch-metadata.processor';
import { Web3Service } from '@app/web3-service/web3.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_METADATA,
    }),
    MongooseModule.forFeature([
      { name: Nfts.name, schema: NftSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [MetadataService, FetchMetadataProcessor, Web3Service],
})
export class MetadataModule {}
