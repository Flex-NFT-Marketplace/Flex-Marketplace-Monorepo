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
import {
  CancelAllOrdersProcessor,
  CancelOfferProcessor,
  CreatorPayoutUpdatedProcessor,
  DeployContractProcessor,
  ERC1155BurnProcessor,
  ERC1155MintProcessor,
  ERC1155TransferProcessor,
  ERC721BurnProcessor,
  ERC721MintProcessor,
  ERC721TransferProcessor,
  PayerUpdatedProcessor,
  PhaseDropUpdatedProcessor,
  TakerAskProcessor,
  TakerBidProcessor,
  UpgradeContractProcessor,
} from './processors';

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
    ]),
    BullModule.registerQueue(
      {
        name: QUEUE_METADATA,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CANCEL_ALL_ORDERS,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CANCEL_OFFER,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CREATOR_PAYOUT_UPDATED,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_DEPLOY_CONTRACT,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_BURN_721,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_MINT_721,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TRANSFER_721,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_BURN_1155,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_MINT_1155,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TRANSFER_1155,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_PAYER_UPDATED,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_PHASE_DROP_UPDATED,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TAKER_ASK,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TAKER_BID,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_UPGRADE_CONTRACT,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  providers: [
    NftItemService,
    UserService,
    Web3Service,
    ERC721MintProcessor,
    CancelAllOrdersProcessor,
    CancelOfferProcessor,
    CreatorPayoutUpdatedProcessor,
    DeployContractProcessor,
    ERC721BurnProcessor,
    ERC721TransferProcessor,
    ERC1155BurnProcessor,
    ERC1155MintProcessor,
    ERC1155TransferProcessor,
    PayerUpdatedProcessor,
    PhaseDropUpdatedProcessor,
    TakerAskProcessor,
    TakerBidProcessor,
    UpgradeContractProcessor,
  ],
})
export class OnchainQueueModule {}
