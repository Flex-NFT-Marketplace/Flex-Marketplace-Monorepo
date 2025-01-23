import { Module } from '@nestjs/common';
import { CollectibleController } from './collectible.controller';
import { CollectibleService } from './collectible.service';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChainSchema,
  Chains,
  FlexHausDrop,
  FlexHausDropSchema,
  FlexHausLike,
  FlexHausLikeSchema,
  FlexHausPayment,
  FlexHausPaymentSchema,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleSchema,
  FlexHausSubscription,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  flexHausSubscriptionSchema,
} from '@app/shared/models';
import { Web3Service } from '@app/web3-service/web3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausDrop.name, schema: FlexHausDropSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
      { name: FlexHausPayment.name, schema: FlexHausPaymentSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: FlexHausLike.name, schema: FlexHausLikeSchema },
      {
        name: FlexHausSecureCollectible.name,
        schema: FlexHausSecureCollectibleSchema,
      },
    ]),
  ],
  controllers: [CollectibleController],
  providers: [CollectibleService, UserService, Web3Service],
})
export class CollectibleModule {}
