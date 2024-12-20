import { Module } from '@nestjs/common';
import { CollectibleController } from './collectible.controller';
import { CollectibleService } from './collectible.service';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FlexHausDrop,
  FlexHausDropSchema,
  FlexHausSubscription,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  flexHausSubscriptionSchema,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausDrop.name, schema: FlexHausDropSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
    ]),
  ],
  controllers: [CollectibleController],
  providers: [CollectibleService, UserService],
})
export class CollectibleModule {}
