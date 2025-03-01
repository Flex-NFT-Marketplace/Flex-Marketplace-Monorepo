import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import {
  ChainSchema,
  Chains,
  FlexHausDonates,
  FlexHausPayment,
  FlexHausPaymentSchema,
  FlexHausSubscription,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  flexHausDonateSchema,
  flexHausSubscriptionSchema,
} from '@app/shared/models';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UserSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
      { name: FlexHausPayment.name, schema: FlexHausPaymentSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: FlexHausDonates.name, schema: flexHausDonateSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
