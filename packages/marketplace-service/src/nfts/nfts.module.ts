import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftController } from './nfts.controller';
import { NftService } from './nfts.service';
import {
  CartSchema,
  Carts,
  ChainSchema,
  Chains,
  CoinPrice,
  CoinPriceSchema,
  Histories,
  HistorySchema,
  NftCollectionFavorites,
  NftCollectionFavoritesSchema,
  NftCollectionSchema,
  NftCollectionStats,
  NftCollectionStatsSchema,
  NftCollections,
  NftSchema,
  Nfts,
  PaymentTokenSchema,
  PaymentTokens,
  Signature,
  SignatureSchema,
  UserSchema,
  Users,
} from '@app/shared/models';
import { UsersModule } from '../user/user.module';
import { Web3Service } from '@app/web3-service/web3.service';
import { MetadataService } from '@app/offchain-worker/src/metadata/metadata.service';
import { SignatureService } from '../signature/signature.service';
import { NftCollectionsService } from '../nft-collections/nftCollections.service';
import { MQ_JOB_DEFAULT_CONFIG, ONCHAIN_QUEUES } from '@app/shared/types';
import { OnchainQueueService } from '@app/shared/utils/queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nfts.name, schema: NftSchema },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
      {
        name: NftCollectionStats.name,
        schema: NftCollectionStatsSchema,
      },
      {
        name: Histories.name,
        schema: HistorySchema,
      },
      {
        name: Chains.name,
        schema: ChainSchema,
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
      {
        name: CoinPrice.name,
        schema: CoinPriceSchema,
      },
    ]),
    UsersModule,
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
  controllers: [NftController],
  providers: [
    NftService,
    Web3Service,
    MetadataService,
    NftCollectionsService,
    SignatureService,
    OnchainQueueService,
  ],
})
export class NftModule {}
