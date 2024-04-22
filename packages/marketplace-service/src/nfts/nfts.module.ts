import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftController } from './nfts.controller';
import { NftService } from './nfts.service';
import {
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nfts.name, schema: NftSchema },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
    ]),
  ],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
