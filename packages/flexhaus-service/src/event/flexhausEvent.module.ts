import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  flexHausEventSchema,
  FlexHausEvents,
  UserSchema,
  Users,
  flexHausSubscriptionSchema,
  FlexHausSubscription,
  ChainSchema,
  Chains,
  FlexHausPayment,
  FlexHausPaymentSchema,
} from '@app/shared/models';
import { FlexHausEventService } from './flexhausEvent.service';
import { UserService } from '../user/user.service';
import { FlexHausEventController } from './flexhausEvent.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FlexHausEvents.name, schema: flexHausEventSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
      { name: FlexHausPayment.name, schema: FlexHausPaymentSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [FlexHausEventService, UserService],
  controllers: [FlexHausEventController],
})
export class FlexHausEventModule {}
