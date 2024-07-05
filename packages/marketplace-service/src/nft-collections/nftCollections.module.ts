import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftCollectionsService } from './nftCollections.service';
import {
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
  PaymentTokenSchema,
  PaymentTokens,
  UserSchema,
  Users,
} from '@app/shared/models';
import { NftCollectionsController } from './nftCollections.controller';
import { UserService } from '../user/user.service';
import { Web3Service } from '@app/web3-service/web3.service';
import { BullModule } from '@nestjs/bull';
import { MQ_JOB_DEFAULT_CONFIG, ONCHAIN_QUEUES } from '@app/shared/types';
import { OnchainQueueService } from '@app/shared/utils/queue';
import { PassportModule } from '@nestjs/passport';
import { JwtAdminStrategy } from '@app/shared/modules';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: PaymentTokens.name,
        schema: PaymentTokenSchema,
      },
      {
        name: Nfts.name,
        schema: NftSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: DropPhases.name,
        schema: DropPhaseSchema,
      },
      {
        name: Histories.name,
        schema: HistorySchema,
      },
      { name: Chains.name, schema: ChainSchema },
    ]),
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
    PassportModule.register({ defaultStrategy: 'jwt-admin' }),
  ],
  controllers: [NftCollectionsController],
  providers: [
    NftCollectionsService,
    UserService,
    Web3Service,
    OnchainQueueService,
    JwtAdminStrategy,
  ],
})
export class NftCollectionsModule {}
