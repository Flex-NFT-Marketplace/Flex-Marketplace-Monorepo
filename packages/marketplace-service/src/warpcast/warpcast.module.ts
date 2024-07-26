import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  ChainSchema,
  Chains,
  DropPhaseSchema,
  DropPhases,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
} from '@app/shared/models';
import { WarpcastService } from './warpcast.service';
import { WarpcastController } from './warpcast.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DropPhases.name, schema: DropPhaseSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
    ]),
  ],
  providers: [WarpcastService],
  controllers: [WarpcastController],
})
export class WarpcastModule {}
