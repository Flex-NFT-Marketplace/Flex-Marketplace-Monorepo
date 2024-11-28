import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { NftCollections, Nfts, Users } from '@app/shared/models';
import {
  NftCollectionResponseDto,
  NftSearchResponseDto,
  SearchQueryDto,
} from './dto/searchResponse';
import { UserResponseDto } from '../user/dto/getUser.dto';
@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Nfts.name) private nftsModel: Model<Nfts>,
    @InjectModel(NftCollections.name)
    private nftCollectionsModel: Model<NftCollections>,
  ) {}

  async search(query: SearchQueryDto) {
    const users = await this.userModel
      .find({ address: { $regex: query.search, $options: 'i' } })
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    const nfts = await this.nftsModel
      .find({ name: { $regex: query.search, $options: 'i' } })
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    const collections = await this.nftCollectionsModel
      .find({ name: { $regex: query.search, $options: 'i' } })
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    console.log('data Collection', collections);
    return {
      users: users.map(user => UserResponseDto.from(user)),
      nfts: nfts.map(nft => NftSearchResponseDto.from(nft)),
      nftCollections: collections.map(collection =>
        NftCollectionResponseDto.from(collection),
      ),
    };
  }
}
