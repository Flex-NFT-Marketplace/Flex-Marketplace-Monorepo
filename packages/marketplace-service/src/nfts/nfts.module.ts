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
import { Web3Service } from '@app/web3-service/web3.service';
import { MetadataService } from '@app/offchain-worker/src/metadata/metadata.service';

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
  providers: [NftService, Web3Service, MetadataService],
})
export class NftModule {}
