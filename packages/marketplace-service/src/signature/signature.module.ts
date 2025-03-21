import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';

import { MongooseModule } from '@nestjs/mongoose';
import {
  Carts,
  CartSchema,
  Chains,
  ChainSchema,
  Histories,
  HistorySchema,
  NftCollectionFavorites,
  NftCollectionFavoritesSchema,
  NftCollections,
  NftCollectionSchema,
  NftCollectionStats,
  NftCollectionStatsSchema,
  Nfts,
  NftSchema,
  PaymentTokens,
  PaymentTokenSchema,
  Signature,
  SignatureSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import { NftCollectionsService } from '../nft-collections/nftCollections.service';
import { NftCollectionsModule } from '../nft-collections/nftCollections.module';

import { MQ_JOB_DEFAULT_CONFIG, ONCHAIN_QUEUES } from '@app/shared/types';
import { OnchainQueueService } from '@app/shared/utils/queue';
import { UserService } from '../user/user.service';
import { Web3Service } from '@app/web3-service/web3.service';
import { CronService } from './task/signatureTask.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Signature.name, schema: SignatureSchema },
      { name: Nfts.name, schema: NftSchema },
      { name: Users.name, schema: UserSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      {
        name: Chains.name,
        schema: ChainSchema,
      },
      { name: Histories.name, schema: HistorySchema },
      {
        name: NftCollectionStats.name,
        schema: NftCollectionStatsSchema,
      },
      {
        name: PaymentTokens.name,
        schema: PaymentTokenSchema,
      },
      {
        name: Carts.name,
        schema: CartSchema,
      },
      {
        name: NftCollectionFavorites.name,
        schema: NftCollectionFavoritesSchema,
      },
    ]),
    NftCollectionsModule,
    BullModule.registerQueue(
      {
        name: ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_721,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_1155,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  controllers: [SignatureController],
  providers: [
    SignatureService,
    Logger,
    NftCollectionsService,
    OnchainQueueService,
    UserService,
    Web3Service,
    CronService,
  ],
  exports: [SignatureService],
})
export class SignatureModule {}
