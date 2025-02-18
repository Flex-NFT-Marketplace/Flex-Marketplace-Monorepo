import { InjectModel } from '@nestjs/mongoose';
import { Histories, HistoryType, NftCollections } from '@app/shared/models';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress } from '@app/shared/utils';
import { Body, Inject, Injectable, Logger } from '@nestjs/common';
import {
  TrendingNftCollectionsDto,
  TrendingNftCollectionsQueryDto,
} from '../dto/trendingNftCollection.dto';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BaseResultPagination } from '@app/shared/types';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NftCollectionTaskService {
  constructor(
    @InjectModel(Histories.name)
    private readonly historyModel: Model<Histories>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<Histories>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  private readonly logger = new Logger(NftCollectionTaskService.name);
  // @Cron(CronExpression.EVERY_12_HOURS)
  async handleLoadingData() {
    try {
      const query: TrendingNftCollectionsQueryDto = {
        page: 1,
        size: 10,
        desc: undefined,
        orderBy: undefined,
        skipIndex: 0,
        sort: undefined,
        toJSON: function (): {
          page: number;
          size: number;
          orderBy: string;
          desc: string;
        } {
          return {
            page: this.page,
            size: this.size,
            orderBy: this.orderBy,
            desc: this.desc,
          };
        },
      };
      await this.getTrendingNFTCollections(query);
    } catch (error) {
      this.logger.error(error);
    }
  }
  async getTrendingNFTCollections(
    @Body() query: TrendingNftCollectionsQueryDto,
  ) {
    console.log('Running Task');
    const key = `trending-nft-collection-${JSON.stringify({ ...query })}`;
    console.log('Key Task', key);
    const data = await this.cacheManager.get(key);
    if (data) {
      return data;
    }

    const result = new BaseResultPagination<TrendingNftCollectionsDto>();
    const { page, size, skipIndex } = query;

    const oneDay = Date.now() - 86400000;
    const sevenDay = Date.now() - 7 * 86400000;

    const filter: any = { type: HistoryType.Sale };
    if (query.nftContract) {
      filter.nftContract = formattedContractAddress(query.nftContract);
    }

    const trendingNftCollection = await this.historyModel.aggregate([
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
        $lookup: {
          from: 'nftcollections', // Reference to the `nftCollection` collection
          localField: '_id',
          foreignField: 'nftContract',
          as: 'collectionInfo',
        },
      },
      {
        $unwind: {
          path: '$collectionInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'nfts',
          let: { nftContract: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$nftContract', '$$nftContract'] },

                    // { $or: [{ isBurned: false }, { amount: { $gt: 0 } }] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$owner',
                totalNFT: { $sum: '$amount' },
              },
            },
            {
              $group: {
                _id: null,
                totalOwners: { $sum: 1 },
                totalNfts: { $sum: '$totalNFT' },
              },
            },
            {
              $project: {
                _id: 0,
                owners: '$totalOwners',
                supply: '$totalNfts',
              },
            },
          ],
          as: 'ownershipStats',
        },
      },
      {
        $unwind: {
          path: '$ownershipStats',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          oneDayVol: { $divide: ['$statistic.vol1D', 1e18] },
          sevenDayVol: { $divide: ['$statistic.vol7D', 1e18] },
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
          totalVol: { $divide: ['$totalVol', 1e18] },
          nftCollection: {
            nftContract: '$_id',
            name: `$collectionInfo.name`,
            avatar: `$collectionInfo.avatar`,
            cover: `$collectionInfo.cover`,
            description: `$collectionInfo.description`,
            symbol: `$collectionInfo.symbol`,
          },
          owners: '$ownershipStats.owners',
          supply: '$ownershipStats.supply',
        },
      },
      {
        $sort: {
          oneDayVol: -1,
          oneDayChange: -1,
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: size,
      },
    ]);

    const total = await this.nftCollectionModel.countDocuments(filter);
    result.data = new PaginationDto<TrendingNftCollectionsDto>(
      trendingNftCollection,
      total,
      Number(page),
      Number(size),
    );
    console.log('Caching Data', result);

    await this.cacheManager.set(key, result, 12 * 60 * 60 * 1e3);
    return result;
  }
}
