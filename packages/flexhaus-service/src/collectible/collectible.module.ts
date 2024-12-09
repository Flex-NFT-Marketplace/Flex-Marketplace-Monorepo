import { Module } from '@nestjs/common';
import { CollectibleController } from './collectible.controller';
import { CollectibleService } from './collectible.service';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
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
    ]),
  ],
  controllers: [CollectibleController],
  providers: [CollectibleService, UserService],
})
export class CollectibleModule {}
