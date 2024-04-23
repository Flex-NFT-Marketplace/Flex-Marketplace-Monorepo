import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftCollectionsService } from './nft-collections.service';
import {
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
  PaymentTokenSchema,
  PaymentTokens,
} from '@app/shared/models';
import { NftCollectionsController } from './nft-collections.controller';

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
    ]),
  ],
  controllers: [NftCollectionsController],
  providers: [NftCollectionsService],
})
export class NftCollectionsModule {}
