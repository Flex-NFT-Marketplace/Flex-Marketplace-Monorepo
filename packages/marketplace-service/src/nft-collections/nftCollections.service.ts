import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Histories,
  HistoryDocument,
  HistoryType,
  NftCollectionDto,
  NftCollections,
  Nfts,
} from '@app/shared/models';
import { Model } from 'mongoose';

import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress, isValidObjectId } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { NftCollectionQueryParams } from './dto/nftCollectionQuery.dto';
import { BaseResultPagination } from '@app/shared/types';
import {
  TopNftCollectionDto,
  TopNftCollectionQueryDto,
} from './dto/topNftCollection.dto';
@Injectable()
export class NftCollectionsService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollections>,
    @InjectModel(Nfts.name) private readonly nftModel: Model<Nfts>,
    @InjectModel(Histories.name)
    private readonly historyModel: Model<HistoryDocument>,
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

  async getTopNFTCollection(
    query: TopNftCollectionQueryDto,
  ): Promise<BaseResultPagination<TopNftCollectionDto>> {
    const { page, size, skipIndex } = query;

    const result = new BaseResultPagination<TopNftCollectionDto>();
    const oneDay = Date.now() - 86400000;
    const sevenDay = Date.now() - 7 * 86400000;
    const filter: any = { type: HistoryType.Sale };
    if (query.nftContract) {
      filter.nftContract = query.nftContract;
    }

    const topNftCollection = await this.historyModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$nftContract',
          totalVol: {
            $sum: '$price',
          },
        },
      },
      {
        $sort: {
          totalVol: -1,
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: size,
      },
      {
        $lookup: {
          from: 'histories',
          let: { nftContract: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$nftContract', '$nftContract'] },
                    { $eq: ['$type', HistoryType.Sale] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$nftContract',
                vol1D: {
                  $sum: {
                    $cond: {
                      if: {
                        $gte: ['$timestamp', oneDay],
                      },
                      then: '$price',
                      else: 0,
                    },
                  },
                },
                volPre1D: {
                  $sum: {
                    $cond: {
                      if: {
                        $and: [
                          { $gte: ['$timestamp', oneDay - 86400000] },
                          { $lt: ['$timestamp', oneDay] },
                        ],
                      },
                      then: '$price',
                      else: 0,
                    },
                  },
                },
                vol7D: {
                  $sum: {
                    $cond: {
                      if: {
                        $gte: ['$timestamp', sevenDay],
                      },
                      then: '$price',
                      else: 0,
                    },
                  },
                },
                volPre7D: {
                  $sum: {
                    $cond: {
                      if: {
                        $and: [
                          { $gte: ['$timestamp', sevenDay - 7 * 86400000] },
                          { $lt: ['$timestamp', sevenDay] },
                        ],
                      },
                      then: '$price',
                      else: 0,
                    },
                  },
                },
              },
            },
          ],
          as: 'statistic',
        },
      },
      {
        $unwind: '$statistic',
      },
      {
        $project: {
          _id: 0,
          nftContract: '$_id',
          oneDayVol: '$statistic.vol1D',
          sevenDayVol: '$statistic.vol7D',
          oneDayChange: {
            $cond: {
              if: { $gt: ['$statistic.volPre1D', 0] },
              then: {
                $divide: [
                  {
                    $multiply: [
                      {
                        $subtract: ['$statistic.vol1D', '$statistic.volPre1D'],
                      },
                      100,
                    ],
                  },
                  '$statistic.volPre1D',
                ],
              },
              else: {
                $divide: [
                  {
                    $multiply: [
                      {
                        $subtract: ['$statistic.vol1D', '$statistic.volPre1D'],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
            },
          },
          sevenDayChange: {
            $cond: {
              if: { $gt: ['$statistic.volPre7D', 0] },
              then: {
                $divide: [
                  {
                    $multiply: [
                      {
                        $subtract: ['$statistic.vol7D', '$statistic.volPre7D'],
                      },
                      100,
                    ],
                  },
                  '$statistic.volPre7D',
                ],
              },
              else: {
                $divide: [
                  {
                    $multiply: [
                      {
                        $subtract: ['$statistic.vol7D', '$statistic.volPre7D'],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
            },
          },
          totalVol: 1,
        },
      },
    ]);

    const total = await this.nftCollectionModel.countDocuments(filter);
    result.data = new PaginationDto<TopNftCollectionDto>(
      topNftCollection,
      total,
      Number(page),
      Number(size),
    );

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
