import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftController } from './nfts.controller';
import { NftService } from './nfts.service';
import {
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
  UserSchema,
  Users,
} from '@app/shared/models';

import { UsersModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nfts.name, schema: NftSchema },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
