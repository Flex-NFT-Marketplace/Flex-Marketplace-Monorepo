import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Staking, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import { StakingQueryDto } from './dto/stakingQuery.dto';

import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress } from '@app/shared/utils';
@Injectable()
export class StakingService {
  constructor(
    @InjectModel(Staking.name) private readonly stakingModel: Model<Staking>,
    @InjectModel(Users.name) private readonly userModel: Model<Users>,
  ) {}
  async getStakingInfo(query: StakingQueryDto) {
    const filter: any = {};
    const result = new BaseResultPagination();
    const { size, skipIndex, sort, page, tokenId, nftContract, userAddress } =
      query;
    if (nftContract) {
      filter.nftContract = query.nftContract;
    }
    if (tokenId) {
      filter.tokenId = query.tokenId;
    }
    if (userAddress) {
      const userDocument = await this.userModel.findOne({
        address: formattedContractAddress(userAddress),
      });
      if (userDocument) {
        filter.user = userDocument._id;
      }
    }
    const totalItem = await this.stakingModel.countDocuments(filter);

    if (size === 0) {
      result.data = new PaginationDto([], totalItem, page, size);
      return result;
    }
    const stakingInfo = await this.stakingModel
      .find(filter)
      .sort(sort)
      .skip(skipIndex)
      .limit(size)
      .populate({
        path: 'user',
        select: 'username address isVerified emailVerified createdAt updatedAt',
      });
    return stakingInfo;
  }
}
