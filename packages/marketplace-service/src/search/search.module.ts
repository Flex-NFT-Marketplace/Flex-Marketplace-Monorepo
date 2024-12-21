import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  NftCollections,
  NftCollectionSchema,
  Nfts,
  NftSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

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
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [],
})
export class SearchModule {}
