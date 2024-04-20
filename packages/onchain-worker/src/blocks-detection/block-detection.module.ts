import { Module } from '@nestjs/common';
import { BlockDetectionController } from './block-detection.controller';
import { NftItemService } from './nft-item.service';
import { Web3Service } from '@app/web3-service/web3.service';
import { UserService } from '../users/user.service';
import { MongooseModule } from '@nestjs/mongoose';
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
  ],
  providers: [NftItemService, Web3Service, UserService],
  controllers: [BlockDetectionController],
})
export class BlockDetectionModule {}
