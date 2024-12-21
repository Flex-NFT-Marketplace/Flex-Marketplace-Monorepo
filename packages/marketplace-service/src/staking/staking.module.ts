import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  NftCollections,
  NftCollectionSchema,
  Nfts,
  NftSchema,
  Staking,
  StakingSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import { StakingController } from './straking.controller';
import { StakingService } from './staking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Nfts.name,
        schema: NftSchema,
      },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: Staking.name,
        schema: StakingSchema,
      },
    ]),
  ],
  controllers: [StakingController],
  providers: [StakingService],
  exports: [],
})
export class StakingModule {}
