import { Module } from '@nestjs/common';
import { CollectibleController } from './collectible.controller';
import { CollectibleService } from './collectible.service';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FlexHausDrop,
  FlexHausDropSchema,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: FlexHausDrop.name, schema: FlexHausDropSchema },
    ]),
  ],
  controllers: [CollectibleController],
  providers: [CollectibleService, UserService],
})
export class CollectibleModule {}
