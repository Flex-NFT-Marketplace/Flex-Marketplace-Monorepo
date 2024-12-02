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
    const {
      size,
      skipIndex,
      orderBy,
      desc,
      page,
      tokenId,
      nftContract,
      userAddress,
    } = query;
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
    // const stakingInfo = await this.stakingModel.aggregate([
    //   { $match: filter },
    //   // { $sort: sort },
    //   { $skip: skipIndex },
    //   { $limit: size },
    //   // {
    //   //   $lookup: {
    //   //     from: 'users',
    //   //     localField: 'user',
    //   //     foreignField: '_id',
    //   //     as: 'user',
    //   //   },
    //   // },
    //   // {
    //   //   $unwind: {
    //   //     path: '$user',
    //   //     preserveNullAndEmptyArrays: true,
    //   //   },
    //   // },
    //   {
    //     $lookup: {
    //       from: 'nfts',
    //       localField: 'nftContract',
    //       foreignField: 'nftContract',
    //       as: 'nftDetails',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$nftDetails',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $project: {
    //       user: {
    //         username: 1,
    //         address: 1,
    //         isVerified: 1,
    //         emailVerified: 1,
    //         createdAt: 1,
    //         updatedAt: 1,
    //       },
    //       nftDetails: 1,
    //       tokenId: 1,
    //       nftContract: 1,
    //       createdAt: 1,
    //       updatedAt: 1,
    //     },
    //   },
    // ]);
    const stakingInfo = await this.stakingModel.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'nfts',
          let: { nftContract: '$nftContract', tokenId: '$tokenId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$nftContract', '$$nftContract'] },
                    { $eq: ['$tokenId', '$$tokenId'] },
                  ],
                },
              },
            },
          ],
          as: 'nftDetails',
        },
      },
      { $unwind: '$nftDetails' },
      {
        $project: {
          user: {
            username: 1,
            address: 1,
            isVerified: 1,
            emailVerified: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          nftDetails: 1,
          tokenId: 1,
          nftContract: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },

      {
        $skip: skipIndex,
      },
      {
        $sort: {
          [orderBy]: desc === 'asc' ? 1 : -1,
        },
      },
      {
        $limit: size,
      },
    ]);
    result.data = new PaginationDto(stakingInfo, totalItem, page, size);
    return result;
  }
}
