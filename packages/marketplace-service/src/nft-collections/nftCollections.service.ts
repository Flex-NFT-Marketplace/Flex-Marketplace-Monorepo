import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { NftCollectionDto, NftCollections, Nfts } from '@app/shared/models';
import { Model } from 'mongoose';

import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress, isValidObjectId } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { NftCollectionQueryParams } from './dto/nftCollectionQuery.dto';
import { BaseResultPagination } from '@app/shared/types';
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
  ): Promise<BaseResultPagination<NftCollectionDto>> {
    const result = new BaseResultPagination<NftCollectionDto>();
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
        filter.owner = formattedContractAddress(owner);
      } else {
        const user = await this.userService.getUser(
          formattedContractAddress(owner),
        );
        if (user) {
          filter.owner = user._id;
        }
      }
    }
    const count = await this.nftCollectionModel.countDocuments(filter);
    if (size === 0) {
      result.data = new PaginationDto<NftCollectionDto>([], count, page, size);
      return result;
    }
    const items = await this.nftCollectionModel
      .find(filter)
      .sort(sort)
      .skip(skipIndex)
      .limit(size)
      .populate('paymentTokens')
      .exec();
    result.data = new PaginationDto(items, count, page, size);
    return result;
  }

  async getNFTCollectionDetail(nftContract: string) {
    const formatedAddress = formattedContractAddress(nftContract);
    const data = (
      await this.nftCollectionModel.findOne({
        nftContract: formatedAddress,
      })
    ).populate([
      {
        path: 'owner',
        select: 'address username avatar cover isVerified',
      },
      {
        path: 'collaboratories',
        select: 'address',
      },
      'paymentTokens',
    ]);

    return data;
  }
}
