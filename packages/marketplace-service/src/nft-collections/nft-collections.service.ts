import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { NftCollectionDto, NftCollections, Nfts } from '@app/shared/models';
import { Model } from 'mongoose';

import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress, isValidObjectId } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { NftCollectionQueryParams } from './dto/nft-collection.filter.dto';
@Injectable()
export class NftCollectionsService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollections>,
    @InjectModel(Nfts.name) private readonly nftModel: Model<Nfts>,
    private readonly userService: UserService,
  ) {}
  async getListNFTCollections(
    query: NftCollectionQueryParams,
  ): Promise<PaginationDto<NftCollectionDto>> {
    const {
      nftContract,
      standard,
      verified,
      owner,
      status,
      size,
      skipIndex,
      sort,
      page,
      name,
    } = query;
    const filter: any = {};
    if (standard) {
      filter.standard = standard;
    }
    if (nftContract) {
      filter.nftContract = formattedContractAddress(nftContract);
    }
    if (verified) {
      filter.verified = verified;
    }
    if (status) {
      filter.status = status;
    }
    if (name) {
      filter.name = { $regex: `${query.name}`, $options: 'i' };
    }

    if (owner) {
      if (isValidObjectId(owner)) {
        filter.owner = owner;
      } else {
        const user = await this.userService.getUser(owner);
        if (user) {
          filter.owner = user._id;
        }
      }
    }
    const count = await this.nftCollectionModel.countDocuments(filter);
    const items = await this.nftCollectionModel
      .find(filter)
      .sort(sort)
      .skip(skipIndex)
      .limit(size)
      .populate([
        {
          path: 'owner',
          select: 'address username avatar cover isVerified',
        },
        {
          path: 'collaboratories',
          select: 'address',
        },
        'paymentTokens',
      ])
      .exec();
    return new PaginationDto(items, count, page, size);
  }

  async getNFTCollectionDetail(nftContract: string) {
    const data = (
      await this.nftCollectionModel.findOne({ nftContract })
    ).populate(['paymentTokens']);

    return data;
  }
}
