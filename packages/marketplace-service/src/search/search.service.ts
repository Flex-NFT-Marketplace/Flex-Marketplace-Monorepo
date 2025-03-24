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
import { formattedContractAddress } from '@app/shared/utils';
@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Nfts.name) private nftsModel: Model<Nfts>,
    @InjectModel(NftCollections.name)
    private nftCollectionsModel: Model<NftCollections>,
  ) {}

  async search(query: SearchQueryDto) {
    const { search, size, skipIndex, sort } = query;
    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }

    if (!search) {
      const users = await this.userModel
        .find()
        .sort(sortOperators)
        .skip(skipIndex)
        .limit(size)
        .exec();
      const nfts = await this.nftsModel
        .find({
          image: { $exists: true, $ne: null },
        })
        .sort(sortOperators)
        .skip(skipIndex)
        .limit(size)
        .exec();
      const collections = await this.nftCollectionsModel
        .find({
          avatar: { $exists: true, $ne: null },
          cover: { $exists: true, $ne: null },
        })
        .sort(sortOperators)
        .skip(skipIndex)
        .limit(size)
        .exec();

      return {
        users: users.map(user => UserResponseDto.from(user)),
        nfts: nfts.map(nft => NftSearchResponseDto.from(nft)),
        nftCollections: collections.map(collection =>
          NftCollectionResponseDto.from(collection),
        ),
      };
    }

    try {
      const formattedSerach = formattedContractAddress(search);
      const users = await this.userModel
        .find({ address: formattedSerach })
        .sort(sortOperators)
        .skip(skipIndex)
        .limit(size)
        .exec();

      let nfts = [];
      let collections = [];
      if (users.length === 0) {
        nfts = await this.nftsModel
          .find({ nftContract: formattedSerach })
          .sort(sortOperators)
          .skip(skipIndex)
          .limit(size)
          .exec();

        collections = await this.nftCollectionsModel
          .find({ nftContract: formattedSerach })
          .sort(sortOperators)
          .skip(skipIndex)
          .limit(size)
          .exec();
      }

      return {
        users: users.map(user => UserResponseDto.from(user)),
        nfts: nfts.map(nft => NftSearchResponseDto.from(nft)),
        nftCollections: collections.map(collection =>
          NftCollectionResponseDto.from(collection),
        ),
      };
    } catch (error) {}

    const users = await this.userModel
      .find({ username: { $regex: search, $options: 'i' } })
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .exec();
    const nfts = await this.nftsModel
      .find({ name: { $regex: search, $options: 'i' } })
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .exec();
    const collections = await this.nftCollectionsModel
      .find({ name: { $regex: search, $options: 'i' } })
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .exec();

    return {
      users: users.map(user => UserResponseDto.from(user)),
      nfts: nfts.map(nft => NftSearchResponseDto.from(nft)),
      nftCollections: collections.map(collection =>
        NftCollectionResponseDto.from(collection),
      ),
    };
  }
}
