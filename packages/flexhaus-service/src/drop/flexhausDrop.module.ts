import { Module } from '@nestjs/common';
import { FlexDropService } from './flexhausDrop.service';
import { UserService } from '../user/user.service';
import { FlexDropController } from './flexhausDrop.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChainSchema,
  Chains,
  FlexHausDonates,
  FlexHausDrop,
  FlexHausDropSchema,
  FlexHausEvents,
  FlexHausPayment,
  FlexHausPaymentSchema,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleSchema,
  FlexHausSet,
  FlexHausSetSchema,
  FlexHausSubscription,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  flexHausDonateSchema,
  flexHausEventSchema,
  flexHausSubscriptionSchema,
} from '@app/shared/models';
import { FlexHausDropTaskService } from './task/flexhausDropTask.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FlexHausSet.name, schema: FlexHausSetSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausDrop.name, schema: FlexHausDropSchema },
      { name: FlexHausEvents.name, schema: flexHausEventSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
      { name: FlexHausPayment.name, schema: FlexHausPaymentSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: FlexHausDonates.name, schema: flexHausDonateSchema },
      {
        name: FlexHausSecureCollectible.name,
        schema: FlexHausSecureCollectibleSchema,
      },
    ]),
  ],
  providers: [FlexDropService, UserService, FlexHausDropTaskService],
  controllers: [FlexDropController],
})
export class FlexHausDropModule {}
