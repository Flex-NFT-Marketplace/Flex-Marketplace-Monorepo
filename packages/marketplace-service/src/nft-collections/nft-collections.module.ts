import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { NftCollectionsService } from './nft-collections.service';
import { NftCollectionSchema, NftCollections } from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
    ]),
  ],
  providers: [NftCollectionsService],
})
export class NftCollectionsModule {}
