import {
  BlockSchema,
  Blocks,
  ChainSchema,
  Chains,
  DropPhaseSchema,
  DropPhases,
  Histories,
  HistorySchema,
  NftCollectionSchema,
  NftCollectionStats,
  NftCollectionStatsSchema,
  NftCollections,
  NftSchema,
  Nfts,
  NotificationSchema,
  Notifications,
  OfferSchema,
  Offers,
  PaymentTokenSchema,
  PaymentTokens,
  SaleSchema,
  Sales,
  Signature,
  SignatureSchema,
  Staking,
  StakingSchema,
  UserSchema,
  Users,
} from '@app/shared/models';
import {
  MQ_JOB_DEFAULT_CONFIG,
  ONCHAIN_QUEUES,
  QUEUE_METADATA,
} from '@app/shared/types';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Web3Service } from '@app/web3-service/web3.service';
import { NftItemService } from './nft-item.service';
import { UserService } from '../users/user.service';
import { CancelOfferProcessor } from './processors';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Nfts.name, schema: NftSchema },
      { name: PaymentTokens.name, schema: PaymentTokenSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: Blocks.name, schema: BlockSchema },
      { name: Users.name, schema: UserSchema },
      { name: Sales.name, schema: SaleSchema },
      { name: Offers.name, schema: OfferSchema },
      { name: Notifications.name, schema: NotificationSchema },
      { name: Histories.name, schema: HistorySchema },
      { name: DropPhases.name, schema: DropPhaseSchema },
      { name: Staking.name, schema: StakingSchema },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
      {
        name: NftCollectionStats.name,
        schema: NftCollectionStatsSchema,
      },
    ]),
    BullModule.registerQueue(
      {
        name: QUEUE_METADATA,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CANCEL_OFFER,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  providers: [NftItemService, UserService, Web3Service, CancelOfferProcessor],
})
export class CancelOfferQueueModule {}
