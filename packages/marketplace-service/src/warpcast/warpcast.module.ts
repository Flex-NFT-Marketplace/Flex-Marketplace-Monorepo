import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  ChainSchema,
  Chains,
  DropPhaseSchema,
  DropPhases,
  Histories,
  HistorySchema,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
  WarpcastUserSchema,
  WarpcastUsers,
} from '@app/shared/models';
import { WarpcastService } from './warpcast.service';
import { WarpcastController } from './warpcast.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DropPhases.name, schema: DropPhaseSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: WarpcastUsers.name, schema: WarpcastUserSchema },
      { name: Histories.name, schema: HistorySchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [WarpcastService],
  controllers: [WarpcastController],
})
export class WarpcastModule {}
