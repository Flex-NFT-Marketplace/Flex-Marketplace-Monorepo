import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftCollectionsService } from './nftCollections.service';
import {
  DropPhaseSchema,
  DropPhases,
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
  PaymentTokenSchema,
  PaymentTokens,
  UserSchema,
  Users,
} from '@app/shared/models';
import { NftCollectionsController } from './nftCollections.controller';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: PaymentTokens.name,
        schema: PaymentTokenSchema,
      },
      {
        name: Nfts.name,
        schema: NftSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: DropPhases.name,
        schema: DropPhaseSchema,
      },
    ]),
  ],
  controllers: [NftCollectionsController],
  providers: [NftCollectionsService, UserService],
})
export class NftCollectionsModule {}
