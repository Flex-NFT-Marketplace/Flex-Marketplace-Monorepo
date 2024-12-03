import { Module } from '@nestjs/common';
import { FlexDropService } from './flexhausDrop.service';
import { UserService } from '../user/user.service';
import { FlexDropController } from './flexhausDrop.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FlexHausSet,
  FlexHausSetSchema,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FlexHausSet.name, schema: FlexHausSetSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Users.name, schema: UserSchema },
    ]),
  ],
  providers: [FlexDropService, UserService],
  controllers: [FlexDropController],
})
export class FlexHausDropModule {}
