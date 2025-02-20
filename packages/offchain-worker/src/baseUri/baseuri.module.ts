import {
  ChainSchema,
  Chains,
  Metadata,
  MetadataSchema,
  NftCollectionSchema,
  NftCollections,
} from '@app/shared/models';
import { QUEUE_BASE_URI } from '@app/shared/types';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Web3Service } from '@app/web3-service/web3.service';
import { FetchBaseUriProcessor } from './queue/fetch-baseuri.processor';
import { BaseUriService } from './baseuri.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_BASE_URI,
    }),
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: Metadata.name, schema: MetadataSchema },
    ]),
  ],
  providers: [FetchBaseUriProcessor, BaseUriService, Web3Service],
})
export class BaseUriModule {}
