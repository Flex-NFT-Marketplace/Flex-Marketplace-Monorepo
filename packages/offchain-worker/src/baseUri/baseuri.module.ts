import {
  ChainSchema,
  Chains,
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
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_BASE_URI,
    }),
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 10000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [FetchBaseUriProcessor, BaseUriService, Web3Service],
})
export class BaseUriModule {}
