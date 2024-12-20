import { Module } from '@nestjs/common';
import { FlexDropService } from './flexhausDrop.service';
import { UserService } from '../user/user.service';
import { FlexDropController } from './flexhausDrop.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FlexHausDrop,
  FlexHausDropSchema,
  FlexHausEvents,
  FlexHausSet,
  FlexHausSetSchema,
  FlexHausSubscription,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  flexHausEventSchema,
  flexHausSubscriptionSchema,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FlexHausSet.name, schema: FlexHausSetSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausDrop.name, schema: FlexHausDropSchema },
      { name: FlexHausEvents.name, schema: flexHausEventSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
    ]),
  ],
  providers: [FlexDropService, UserService],
  controllers: [FlexDropController],
})
export class FlexHausDropModule {}
