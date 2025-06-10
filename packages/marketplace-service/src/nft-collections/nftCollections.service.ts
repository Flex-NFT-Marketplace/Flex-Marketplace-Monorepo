/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ChainDocument,
  Chains,
  CoinPrice,
  CoinPriceDocument,
  Histories,
  HistoryDocument,
  HistoryType,
  NftCollectionDocument,
  NftCollectionDto,
  NftCollectionFavorites,
  NftCollectionFavoritesDocument,
  NftCollections,
  NftCollectionStats,
  Nfts,
  Signature,
} from '@app/shared/models';
import { Model } from 'mongoose';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import {
  arraySliceProcess,
  formattedContractAddress,
  isValidObjectId,
} from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { NftCollectionQueryParams } from './dto/nftCollectionQuery.dto';
import {
  BaseQueryParams,
  BaseResult,
  BaseResultPagination,
  ONCHAIN_JOBS,
  ONCHAIN_QUEUES,
} from '@app/shared/types';
import {
  TopNftCollectionDto,
  TopNftCollectionQueryDto,
} from './dto/topNftCollection.dto';
import { Web3Service } from '@app/web3-service/web3.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventType, LogsReturnValues } from '@app/web3-service/types';
import { OnchainQueueService } from '@app/shared/utils/queue';
import { NFTCollectionSuply } from './dto/CollectionSupply.dto';
import {
  NftCollectionHolders,
  NftCollectionHoldersQuery,
} from './dto/CollectionHolders.dto';
import { NftCollectionAttributeDto } from './dto/CollectionAttribute.dto';
import { UpdateCollectionDetailDto } from './dto/updateCollectionDetail.dto';
import { retryUntil } from '@app/shared/index';
import axios from 'axios';
import * as _ from 'lodash';
import {
  TrendingNftCollectionsDto,
  TrendingNftCollectionsQueryDto,
} from './dto/trendingNftCollection.dto';
import { CollectionAddressDto } from './dto/CollectionAddress.dto';

@Injectable()
export class NftCollectionsService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollections>,
    @InjectModel(Nfts.name) private readonly nftModel: Model<Nfts>,
    @InjectModel(Histories.name)
    private readonly historyModel: Model<HistoryDocument>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_721)
    private readonly erc721UpdateMetadataQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_1155)
    private readonly erc1155UpdateMetadataQueue: Queue<LogsReturnValues>,
    @InjectModel(NftCollectionStats.name)
    private readonly nftCollectionStatsModel: Model<NftCollectionStats>,
    @InjectModel(Signature.name)
    private readonly signatureModel: Model<Signature>,
    @InjectModel(NftCollectionFavorites.name)
    private readonly nftCollectionFavoriteModel: Model<NftCollectionFavoritesDocument>,
    @InjectModel(CoinPrice.name)
    private readonly coinPriceModel: Model<CoinPriceDocument>,
    private readonly onchainQueueService: OnchainQueueService,
    private readonly userService: UserService,
    private readonly web3Service: Web3Service,
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
      isNonFungibleFlexDropToken,
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
    if (isNonFungibleFlexDropToken && isNonFungibleFlexDropToken !== null) {
      filter.isNonFungibleFlexDropToken = isNonFungibleFlexDropToken;
    }

    if (owner) {
      if (isValidObjectId(owner)) {
        filter.owner = owner;
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
    if (count === 0 || size === 0) {
      result.data = new PaginationDto<NftCollectionDto>([], count, page, size);
      return result;
    }
    const now = Date.now();
    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }
    const items = await this.nftCollectionModel
      .find(filter)
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .populate([
        {
          path: 'owner',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        'paymentTokens',
      ])
      .exec();

    const afterAlterItem: NftCollectionDocument[] = [];
    await arraySliceProcess(
      items,
      async slicedItems => {
        await Promise.all(
          slicedItems.map(async item => {
            if (item.avatar === undefined) {
              try {
                const newItem = await this.getCollectionImage(item);
                afterAlterItem.push(newItem);
              } catch (error) {
                afterAlterItem.push(item);
              }
            } else {
              afterAlterItem.push(item);
            }
          }),
        );
      },
      20,
    );
    result.data = new PaginationDto(afterAlterItem, count, page, size);
    console.log(`finish in ${Date.now() - now} ms`);

    return result;
  }

  async getTopHolders(
    query: NftCollectionHoldersQuery,
  ): Promise<BaseResultPagination<NftCollectionHolders>> {
    const { page, size, skipIndex, nftContract } = query;
    const result = new BaseResultPagination<NftCollectionHolders>();
    const formattedAddress = formattedContractAddress(nftContract);
    const totalSupply = await this.getTotalOwners(formattedAddress);

    if (totalSupply.owners == 0) {
      result.data = new PaginationDto<NftCollectionHolders>([], 0, page, size);
    }

    const topHolders = await this.nftModel.aggregate([
      {
        $match: {
          nftContract: formattedAddress,
          $or: [{ isBurned: false }, { amount: { $gt: 0 } }],
        },
      },
      {
        $group: {
          _id: '$owner',
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { amount: -1 },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: size,
      },
      {
        $lookup: {
          from: 'users',
          let: { user: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$$user', '$_id'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                address: 1,
                isVerified: 1,
              },
            },
          ],
          as: 'owner',
        },
      },
      {
        $unwind: '$owner',
      },
      {
        $project: {
          _id: 0,
          owner: 1,
          amount: 1,
          percentage: {
            $divide: [{ $multiply: ['$amount', 100] }, totalSupply.supply],
          },
        },
      },
    ]);

    result.data = new PaginationDto<NftCollectionHolders>(
      topHolders,
      totalSupply.owners,
      page,
      size,
    );

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
      filter.nftContract = formattedContractAddress(query.nftContract);
    }

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const coinPrice = await this.coinPriceModel
      .find({ timestamp: now })
      .populate(['token0']);
    const strkPrice = coinPrice.find(i => i.token0.symbol === 'STRK');
    const usdcPrice = coinPrice.find(i => i.token0.symbol === 'USDC');

    const topNftCollection = await this.historyModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: { nftContract: '$nftContract', payment: '$paymentToken' },
          totalVol: {
            $sum: '$price',
          },
        },
      },
      {
        $project: {
          _id: 0,
          nftContract: '$_id.nftContract',
          paymentToken: '$_id.payment',
          totalVolInEth: {
            $cond: {
              if: { $eq: ['$_id.payment', strkPrice.token0._id] },
              then: {
                $multiply: ['$totalVol', Number(strkPrice.price) / 1e18],
              },
              else: {
                $cond: {
                  if: { $eq: ['$_id.payment', usdcPrice.token0._id] },
                  then: {
                    $multiply: ['$totalVol', Number(usdcPrice.price) / 1e6],
                  },
                  else: '$totalVol',
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$nftContract',
          paymentToken: {
            $first: '$paymentToken',
          },
          totalVolInEth: {
            $sum: '$totalVolInEth',
          },
        },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     totalVols: {
      //       $arrayToObject: '$totalVols',
      //     },
      //   },
      // },
      // {
      //   $replaceRoot: {
      //     newRoot: {
      //       $mergeObjects: [{ nftContract: '$_id' }, '$totalVols'],
      //     },
      //   },
      // },
      {
        $sort: {
          totalVolInEth: -1,
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
                _id: { nftContract: '$nftContract', payment: '$paymentToken' },
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
            {
              $project: {
                _id: 0,
                nftContract: '$_id.nftContract',
                vol1DInEth: {
                  $cond: {
                    if: {
                      $eq: ['$_id.payment', strkPrice.token0._id],
                    },
                    then: {
                      $multiply: ['$vol1D', Number(strkPrice.price) / 1e18],
                    },
                    else: {
                      $cond: {
                        if: {
                          $eq: ['$_id.payment', usdcPrice.token0._id],
                        },
                        then: {
                          $multiply: ['$vol1D', Number(usdcPrice.price) / 1e6],
                        },
                        else: '$vol1D',
                      },
                    },
                  },
                },
                volPre1DInEth: {
                  $cond: {
                    if: {
                      $eq: ['$_id.payment', strkPrice.token0._id],
                    },
                    then: {
                      $multiply: ['$volPre1D', Number(strkPrice.price) / 1e18],
                    },
                    else: {
                      $cond: {
                        if: {
                          $eq: ['$_id.payment', usdcPrice.token0._id],
                        },
                        then: {
                          $multiply: [
                            '$volPre1D',
                            Number(usdcPrice.price) / 1e6,
                          ],
                        },
                        else: '$volPre1D',
                      },
                    },
                  },
                },
                vol7DInEth: {
                  $cond: {
                    if: {
                      $eq: ['$_id.payment', strkPrice.token0._id],
                    },
                    then: {
                      $multiply: ['$vol7D', Number(strkPrice.price) / 1e18],
                    },
                    else: {
                      $cond: {
                        if: {
                          $eq: ['$_id.payment', usdcPrice.token0._id],
                        },
                        then: {
                          $multiply: ['$vol7D', Number(usdcPrice.price) / 1e6],
                        },
                        else: '$vol7D',
                      },
                    },
                  },
                },
                volPre7DInEth: {
                  $cond: {
                    if: {
                      $eq: ['$_id.payment', strkPrice.token0._id],
                    },
                    then: {
                      $multiply: ['$volPre7D', Number(strkPrice.price) / 1e18],
                    },
                    else: {
                      $cond: {
                        if: {
                          $eq: ['$_id.payment', usdcPrice.token0._id],
                        },
                        then: {
                          $multiply: [
                            '$volPre7D',
                            Number(usdcPrice.price) / 1e6,
                          ],
                        },
                        else: '$volPre7D',
                      },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: '$nftContract',
                vol1DInEth: {
                  $sum: '$vol1DInEth',
                },
                volPre1DInEth: {
                  $sum: '$volPre1DInEth',
                },
                vol7DInEth: {
                  $sum: '$vol7DInEth',
                },
                volPre7DInEth: {
                  $sum: '$volPre7DInEth',
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
          from: 'nftcollections',
          localField: '_id',
          foreignField: 'nftContract',
          as: 'collectionInfo',
        },
      },
      {
        $unwind: {
          path: '$collectionInfo', // Unwind the array to get a single object
          preserveNullAndEmptyArrays: true, // Keep the document if no match is found
        },
      },
      {
        $project: {
          _id: 0,
          nftContract: '$_id',
          totalVolInEth: 1,
          // oneDayVol: { $divide: ['$statistic.vol1D', 1e18] },
          // sevenDayVol: { $divide: ['$statistic.vol7D', 1e18] },
          // oneDayChange: {
          //   $cond: {
          //     if: { $gt: ['$statistic.volPre1D', 0] },
          //     then: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$statistic.vol1D', '$statistic.volPre1D'],
          //             },
          //             100,
          //           ],
          //         },
          //         '$statistic.volPre1D',
          //       ],
          //     },
          //     else: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$statistic.vol1D', '$statistic.volPre1D'],
          //             },
          //             100,
          //           ],
          //         },
          //         1,
          //       ],
          //     },
          //   },
          // },
          // sevenDayChange: {
          //   $cond: {
          //     if: { $gt: ['$statistic.volPre7D', 0] },
          //     then: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$statistic.vol7D', '$statistic.volPre7D'],
          //             },
          //             100,
          //           ],
          //         },
          //         '$statistic.volPre7D',
          //       ],
          //     },
          //     else: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$statistic.vol7D', '$statistic.volPre7D'],
          //             },
          //             100,
          //           ],
          //         },
          //         1,
          //       ],
          //     },
          //   },
          // },
          // totalVol: { $divide: ['$totalVol', 1e18] },
          statistic: 1,
          // '6604f1c682c9669beb15ce89': 1,
          // '6604f1c682c9669beb15ce90': 1,
          // '6604f24982c9669beb15ce8b': 1,
          nftCollection: {
            name: `$collectionInfo.name`,
            avatar: `$collectionInfo.avatar`,
            cover: `$collectionInfo.cover`,
            description: `$collectionInfo.description`,
            symbol: `$collectionInfo.symbol`,
          },
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

  // Trending Include Floor Price, 1D Change , 1D Vol, total Vol, owners , supply
  async getTrendingNFTCollections(
    query: TrendingNftCollectionsQueryDto,
  ): Promise<BaseResultPagination<TrendingNftCollectionsDto>> {
    const { page, size, skipIndex } = query;

    const result = new BaseResultPagination<TrendingNftCollectionsDto>();

    const oneDay = Date.now() - 86400000;
    // const sevenDay = Date.now() - 7 * 86400000;

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    const coinPrice = await this.coinPriceModel
      .find({ timestamp: now })
      .populate(['token0']);
    const strkPrice = coinPrice.find(i => i.token0.symbol === 'STRK');
    const usdcPrice = coinPrice.find(i => i.token0.symbol === 'USDC');

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
          _id: { nftContract: '$nftContract', payment: '$paymentToken' },
          totalVol: {
            $sum: '$price',
          },
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
        },
      },
      {
        $project: {
          _id: 0,
          nftContract: '$_id.nftContract',
          paymentToken: '$_id.payment',
          totalVolInEth: {
            $cond: {
              if: { $eq: ['$_id.payment', strkPrice.token0._id] },
              then: {
                $multiply: ['$totalVol', Number(strkPrice.price) / 1e18],
              },
              else: {
                $cond: {
                  if: { $eq: ['$_id.payment', usdcPrice.token0._id] },
                  then: {
                    $multiply: ['$totalVol', Number(usdcPrice.price) / 1e6],
                  },
                  else: '$totalVol',
                },
              },
            },
          },
          vol1DInEth: {
            $cond: {
              if: { $eq: ['$_id.payment', strkPrice.token0._id] },
              then: {
                $multiply: ['$vol1D', Number(strkPrice.price) / 1e18],
              },
              else: {
                $cond: {
                  if: { $eq: ['$_id.payment', usdcPrice.token0._id] },
                  then: {
                    $multiply: ['$vol1D', Number(usdcPrice.price) / 1e6],
                  },
                  else: '$vol1D',
                },
              },
            },
          },
          volPre1DInEth: {
            $cond: {
              if: { $eq: ['$_id.payment', strkPrice.token0._id] },
              then: {
                $multiply: ['$volPre1D', Number(strkPrice.price) / 1e18],
              },
              else: {
                $cond: {
                  if: { $eq: ['$_id.payment', usdcPrice.token0._id] },
                  then: {
                    $multiply: ['$volPre1D', Number(usdcPrice.price) / 1e6],
                  },
                  else: '$volPre1D',
                },
              },
            },
          },
        },
      },
      // {
      //   $group: {
      //     _id: '$_id.nftContract',
      //     totalVols: {
      //       $push: {
      //         k: { $toString: '$_id.payment' },
      //         v: '$totalVol',
      //       },
      //     },
      //     vol1D: {
      //       $push: {
      //         k: { $toString: '$_id.payment' },
      //         v: '$vol1D',
      //       },
      //     },
      //     volPre1D: {
      //       $push: {
      //         k: { $toString: '$_id.payment' },
      //         v: '$volPre1D',
      //       },
      //     },
      //   },
      // },
      // {
      //   $project: {
      //     _id: 0,
      //     nftContract: '$_id',
      //     totalVols: {
      //       $arrayToObject: '$totalVols',
      //     },
      //     vol1D: {
      //       $arrayToObject: '$vol1D',
      //     },
      //     volPre1D: {
      //       $arrayToObject: '$volPre1D',
      //     },
      //   },
      // },
      // {
      //   $replaceRoot: {
      //     newRoot: {
      //       $mergeObjects: [
      //         { nftContract: '$_id' },
      //         '$totalVols',
      //         { vol1D: '$vol1D' },
      //         { volPre1D: '$volPre1D' },
      //       ],
      //     },
      //   },
      // },
      {
        $sort: {
          vol1DInEth: -1,
          totalVolInEth: -1,
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
          from: 'nftcollections', // Reference to the `nftCollection` collection
          localField: 'nftContract',
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
          let: { nftContract: '$nftContract' },
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
          vol1DInEth: '$vol1DInEth',
          // sevenDayVol: '$vol7D',
          volPre1DInEth: '$volPre1DInEth',
          // oneDayChange: {
          //   $cond: {
          //     if: { $gt: ['$volPre1D', 0] },
          //     then: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$vol1D', '$volPre1D'],
          //             },
          //             100,
          //           ],
          //         },
          //         '$volPre1D',
          //       ],
          //     },
          //     else: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$vol1D', '$volPre1D'],
          //             },
          //             100,
          //           ],
          //         },
          //         1,
          //       ],
          //     },
          //   },
          // },
          // sevenDayChange: {
          //   $cond: {
          //     if: { $gt: ['$volPre7D', 0] },
          //     then: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$vol7D', '$volPre7D'],
          //             },
          //             100,
          //           ],
          //         },
          //         '$volPre7D',
          //       ],
          //     },
          //     else: {
          //       $divide: [
          //         {
          //           $multiply: [
          //             {
          //               $subtract: ['$vol7D', '$volPre7D'],
          //             },
          //             100,
          //           ],
          //         },
          //         1,
          //       ],
          //     },
          //   },
          // },
          totalVolInEth: '$totalVolInEth',
          nftCollection: {
            nftContract: '$nftContract',
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
    ]);

    const total = await this.nftCollectionModel.countDocuments(filter);

    result.data = new PaginationDto<TrendingNftCollectionsDto>(
      trendingNftCollection,
      total,
      Number(page),
      Number(size),
    );

    return result;
  }

  async getNFTCollectionDetail(nftContract: string) {
    const formatedAddress = formattedContractAddress(nftContract);
    const data = await this.nftCollectionModel
      .findOne({
        nftContract: formatedAddress,
      })
      .populate([
        {
          path: 'owner',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        'paymentTokens',
        'nftCollectionStats',
      ]);

    console.log('Data NFT Collection Detail', data);
    if (!data) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    if (data.avatar === undefined) {
      try {
        const newItem = await this.getCollectionImage(data);
        return new BaseResult(newItem);
      } catch (error) {
        return new BaseResult(data);
      }
    }
    return new BaseResult(data);
  }

  async updateCollectionMetadatas(nftContract: string, isNew: boolean) {
    const totalNFts = await this.nftModel.countDocuments({ nftContract });
    const chainDocument = await this.chainModel.findOne();

    const provider = this.web3Service.getProvider(chainDocument.rpc);

    const size = 20;
    const totalPages = Math.ceil((1.0 * totalNFts) / size);
    let page = 1;
    const txSet: string[] = [];
    const filter = isNew
      ? [
          {
            $match: {
              nftContract,
              type: HistoryType.Mint,
            },
          },
        ]
      : [
          {
            $match: {
              nftContract,
              type: HistoryType.Mint,
            },
          },
          {
            $lookup: {
              from: 'nfts',
              let: { nftContract: '$nftContract', tokenId: '$tokenId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$nftContract', '$nftContract'] },
                        { $eq: ['$$tokenId', '$tokenId'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    name: 1,
                  },
                },
              ],
              as: 'nft',
            },
          },
          {
            $unwind: '$nft',
          },
          {
            $match: {
              'nft.name': { $exists: false },
            },
          },
        ];
    while (page <= totalPages) {
      const targetSet: string[] = [];
      const histories = await this.historyModel.aggregate([
        ...filter,
        {
          $skip: size * (page - 1),
        },
        {
          $limit: size,
        },
      ]);

      for (const tx of histories) {
        if (!txSet.includes(tx.txHash)) {
          txSet.push(tx.txHash);
          targetSet.push(tx.txHash);
        }
      }

      await Promise.all(
        targetSet.map(async tx => {
          const trasactionReceipt = await provider.getTransactionReceipt(tx);

          const block = await provider.getBlock(
            (trasactionReceipt as any).block_number,
          );

          const eventWithTypes = this.web3Service.getReturnValuesEvent(
            trasactionReceipt,
            chainDocument,
            block.timestamp,
          );

          let jobName = null;
          let queue = null;

          let index = 0;
          for (const ev of eventWithTypes) {
            ev.index = index;

            if (
              ev.eventType === EventType.MINT_1155 &&
              ev.returnValues.nftAddress == nftContract
            ) {
              ev.eventType = EventType.UPDATE_METADATA_1155;
              jobName = ONCHAIN_JOBS.JOB_UPDATE_METADATA_1155;
              queue = this.erc1155UpdateMetadataQueue;
              await this.onchainQueueService.add(queue, jobName, ev);
            } else if (
              ev.eventType === EventType.MINT_721 &&
              ev.returnValues.nftAddress == nftContract
            ) {
              ev.eventType = EventType.UPDATE_METADATA_721;
              jobName = ONCHAIN_JOBS.JOB_UPDATE_METADATA_721;
              queue = this.erc721UpdateMetadataQueue;
              await this.onchainQueueService.add(queue, jobName, ev);
            }
            index++;
          }
        }),
      );

      page++;
    }

    // const nfts = await this.nftModel.aggregate([
    //   {
    //     $match: {
    //       nftContract,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$tokenId',
    //       count: {
    //         $sum: 1,
    //       },
    //     },
    //   },
    //   {
    //     $match: {
    //       count: { $gt: 1 },
    //     },
    //   },
    // ]);

    // console.log(nfts);

    // for(const nft of nfts) {
    //   await this.nftModel.deleteOne({nftContract, tokenId: nft._id, image: { $exists: false }})
    // }
  }

  async getAttributes(
    nftContract: string,
  ): Promise<NftCollectionAttributeDto[]> {
    const formattedAddress = formattedContractAddress(nftContract);
    const totalNfts = await this.nftModel.countDocuments({
      nftContract: formattedAddress,
      isBurned: false,
    });

    const attributes = await this.nftModel.aggregate([
      {
        $match: {
          nftContract: formattedAddress,
          isBurned: false,
        },
      },
      {
        $unwind: {
          path: '$attributes',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            trait_type: '$attributes.trait_type',
            value: '$attributes.value',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.trait_type',
          options: {
            $push: {
              value: '$_id.value',
              total: '$count',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          trait_type: '$_id',
          options: 1,
        },
      },
    ]);

    for (const att of attributes) {
      for (const op of att.options) {
        op.rarity = 1 / (op.total / totalNfts);
      }
    }
    return attributes;
  }

  async updateCollectionDetail(
    body: UpdateCollectionDetailDto,
  ): Promise<BaseResult<string>> {
    // const ownerDocument = await this.userService.getOrCreateUser(owner);

    const { nftContract, description, externalLink, avatar, cover } = body;

    const formatedAddress = formattedContractAddress(nftContract);
    let nftCollection: NftCollectionDocument;
    await retryUntil(
      async () => {
        nftCollection = await this.nftCollectionModel.findOne({
          nftContract: formatedAddress,
          // owner: ownerDocument,
        });
      },
      nftCollection => nftCollection !== null,
      5,
      2000, // delay 2s
    );

    if (!nftCollection) {
      throw new HttpException(
        'You are not the owner of the collecion.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.nftCollectionModel.findOneAndUpdate(
      {
        nftContract: formatedAddress,
      },
      {
        $set: {
          avatar,
          cover,
          description,
          externalLink,
        },
      },
    );

    return new BaseResult('Update Collection detail successful.');
  }

  async getTotalOwners(nftContract: string): Promise<NFTCollectionSuply> {
    const totalOwners = await this.nftModel.aggregate([
      {
        $match: {
          nftContract,
          $or: [{ isBurned: false }, { amount: { $gt: 0 } }],
        },
      },
      {
        $group: {
          _id: '$owner',
          totalNFT: {
            $sum: '$amount',
          },
        },
      },
      {
        $group: {
          _id: 0,
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
    ]);

    if (totalOwners.length == 0) {
      return {
        owners: 0,
        supply: 0,
      };
    }

    return totalOwners[0];
  }
  async getCollectionImage(
    collection: NftCollectionDocument,
  ): Promise<NftCollectionDocument> {
    const formattedAddress = (address: string) => {
      while (address.startsWith('0x0')) {
        address = address.replace('0x0', '0x');
      }

      return address;
    };
    const url = `https://api2.pyramid.market/api/collection/${formattedAddress(collection.nftContract)}`;
    const data = await axios.get(url);
    const collectionDetail = data.data.data;

    let avatar: string = null;
    let cover: string = null;
    let description: string = null;
    if (collectionDetail.image !== 'https://pyramid.market/not-available.png') {
      avatar = collectionDetail.image;
    }

    if (
      collectionDetail.bannerImage !==
      'https://cdn.pyramid.market/external/assets/collections/default/banner.png'
    ) {
      cover = collectionDetail.bannerImage;
    }

    if (collectionDetail.description) {
      description = collectionDetail.description;
    }

    const newCollection = await this.nftCollectionModel
      .findOneAndUpdate(
        { _id: collection._id },
        { $set: { avatar, cover, description } },
        { new: true },
      )
      .populate([
        {
          path: 'owner',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        'paymentTokens',
      ]);

    return newCollection;
  }

  async updateAllNftCollectionStatsData() {
    const nftCollections = await this.nftCollectionModel.find();
    const oneDay = Date.now() - 86400000;
    const sevenDays = Date.now() - 7 * 86400000;
    for (const nftCollection of nftCollections) {
      const nftCollectionStats = await this.computeNftCollectionStats(
        nftCollection.nftContract,
        oneDay,
        sevenDays,
      );
      if (nftCollectionStats != undefined) {
        const nftCollectionStatsDocument =
          await this.nftCollectionStatsModel.findOneAndUpdate(
            { nftContract: nftCollection.nftContract },
            nftCollectionStats,
            { upsert: true, new: true },
          );

        console.log('Updated NFT Collection Stats: ', nftCollectionStats);
        await this.nftCollectionModel.findOneAndUpdate(
          {
            nftContract: nftCollection.nftContract,
          },
          {
            $set: {
              nftCollectionStats: nftCollectionStatsDocument,
            },
          },
        );
      }
    }
  }

  async getOrCreateNftCollectionStats(
    nftContract: string,
  ): Promise<NftCollectionStats> {
    const formattedAddress = formattedContractAddress(nftContract);
    const nftCollections = await this.nftCollectionModel.findOne({
      nftContract: formattedAddress,
    });
    if (!nftCollections) {
      throw new HttpException(
        'NFT Collection Stats not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const oneDay = Date.now() - 86400000;
    const sevenDays = Date.now() - 7 * 86400000;
    const computeNftCollectionStats = await this.computeNftCollectionStats(
      formattedAddress,
      oneDay,
      sevenDays,
    );
    if (computeNftCollectionStats != undefined) {
      const nftCollectionStatsDocument =
        await this.nftCollectionStatsModel.findOneAndUpdate(
          { nftContract: formattedAddress },
          computeNftCollectionStats,
          { upsert: true, new: true },
        );
      await this.nftCollectionModel.findOneAndUpdate(
        {
          nftContract: formattedAddress,
        },
        {
          $set: {
            nftCollectionStats: nftCollectionStatsDocument,
          },
        },
      );
      return nftCollectionStatsDocument;
    }

    const newNftCollectionStats: NftCollectionStats = {
      nftContract: formattedAddress,
      bestOffer: 0,
      nftCount: 0,
      ownerCount: 0,
      totalVolume: 0,
      totalListingCount: 0,
      floorPrice: 0,
      stats1D: {
        saleCount: 0,
        volume: 0,
        avgPrice: 0,
        volChange: 0,
      },
      stats7D: {
        saleCount: 0,
        volume: 0,
        avgPrice: 0,
        volChange: 0,
      },
      lastUpdated: Date.now(),
    };
    const nftCollectionStatsDocument =
      await this.nftCollectionStatsModel.create(newNftCollectionStats);
    await this.nftCollectionModel.findOneAndUpdate(
      {
        nftContract: formattedAddress,
      },
      {
        $set: {
          nftCollectionStats: nftCollectionStatsDocument,
        },
      },
    );
    return nftCollectionStatsDocument;
  }
  async computeNftCollectionStats(
    nftContract: string,
    oneDay: number,
    sevenDays: number,
  ): Promise<NftCollectionStats> {
    try {
      const stats = await this.historyModel.aggregate([
        {
          $match: {
            nftContract,
            type: HistoryType.Sale,
            timestamp: { $gte: sevenDays - 7 * 86400000 },
          },
        },
        {
          $group: {
            _id: '$nftContract',
            vol1D: {
              $sum: {
                $cond: [{ $gte: ['$timestamp', oneDay] }, '$price', 0],
              },
            },
            volPre1D: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$timestamp', oneDay - 86400000] },
                      { $lt: ['$timestamp', oneDay] },
                    ],
                  },
                  '$price',
                  0,
                ],
              },
            },
            vol7D: {
              $sum: {
                $cond: [{ $gte: ['$timestamp', sevenDays] }, '$price', 0],
              },
            },
            volPre7D: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$timestamp', sevenDays - 7 * 86400000] },
                      { $lt: ['$timestamp', sevenDays] },
                    ],
                  },
                  '$price',
                  0,
                ],
              },
            },
            totalVol: { $sum: '$price' },
            saleCount1D: {
              $sum: { $cond: [{ $gte: ['$timestamp', oneDay] }, 1, 0] },
            },
            saleCount7D: {
              $sum: { $cond: [{ $gte: ['$timestamp', sevenDays] }, 1, 0] },
            },
          },
        },
        {
          $group: {
            _id: '$_id',
            totalVol: { $first: '$totalVol' },
            saleCount1D: { $first: '$saleCount1D' },
            saleCount7D: { $first: '$saleCount7D' },
          },
        },
        {
          $lookup: {
            from: 'nftcollections',
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
      ]);
      const statsSignature = await this.signatureModel.aggregate([
        {
          $match: {
            contract_address: nftContract,
            is_burned: { $ne: true }, // Exclude burned entries
          },
        },
        {
          $facet: {
            floorPrice: [
              { $match: { status: 'LISTING' } },
              { $group: { _id: null, minPrice: { $min: '$price' } } },
            ],
            bestOffer: [
              { $match: { status: { $in: ['BID', 'BIDDING'] } } },
              { $group: { _id: null, maxPrice: { $max: '$price' } } },
            ],
            totalListingCount: [
              { $match: { status: 'LISTING' } },
              { $count: 'count' },
            ],
            saleCount: [{ $match: { status: 'SOLD' } }, { $count: 'count' }],
          },
        },
        {
          $project: {
            floorPrice: { $arrayElemAt: ['$floorPrice.minPrice', 0] },
            bestOffer: { $arrayElemAt: ['$bestOffer.maxPrice', 0] },
            totalListingCount: {
              $arrayElemAt: ['$totalListingCount.count', 0],
            },
            saleCount: { $arrayElemAt: ['$saleCount.count', 0] },
          },
        },
      ]);
      const totalOwner = await this.getTotalOwners(nftContract);
      const result = stats[0];

      const result2 = statsSignature[0];
      return {
        nftContract,
        bestOffer: result2?.bestOffer || 0,
        nftCount: totalOwner.supply || 0,
        ownerCount: totalOwner.owners || 0,
        totalVolume: result?.totalVol / 1e18 || 0,
        totalListingCount: result2?.totalListingCount || 0,
        floorPrice: result2?.floorPrice || 0,
        stats1D: {
          saleCount: result?.saleCount1D || 0,
          volume: result?.vol1D || 0,
          avgPrice:
            result?.vol1D && totalOwner.supply
              ? result?.vol1D / totalOwner.supply
              : 0,
          volChange:
            result?.volPre1D && result?.vol1D
              ? ((result?.vol1D - result?.volPre1D) / result?.volPre1D) * 100
              : 0,
        },
        stats7D: {
          saleCount: result?.saleCount7D || 0,
          volume: result?.vol7D || 0,
          avgPrice: result?.vol7D / (totalOwner.supply || 1),
          volChange: result?.volPre7D
            ? ((result?.vol7D - result?.volPre7D) / result?.volPre7D) * 100
            : 0,
        },
        lastUpdated: Date.now(),
      };
    } catch (error) {
      return undefined;
    }
  }

  async addFavoriteNFTCollection(
    body: CollectionAddressDto,
    user: string,
  ): Promise<boolean> {
    const { nftContract } = body;

    const nftCollectionDocument = await this.nftCollectionModel.findOne({
      nftContract: formattedContractAddress(nftContract),
    });

    if (!nftCollectionDocument) {
      throw new HttpException('NFT Collection not found', HttpStatus.NOT_FOUND);
    }

    const userDocument = await this.userService.getOrCreateUser(user);

    const nftCollectionFavorite = await this.nftCollectionFavoriteModel.findOne(
      {
        user: userDocument._id,
        nftCollection: nftCollectionDocument._id,
      },
    );

    if (nftCollectionFavorite && !nftCollectionFavorite.isUnFavorite) {
      throw new HttpException('Already favorited', HttpStatus.BAD_REQUEST);
    }

    await this.nftCollectionFavoriteModel.findOneAndUpdate(
      {
        user: userDocument._id,
        nftCollection: nftCollectionDocument._id,
      },
      {
        $set: {
          isUnFavorite: false,
        },
      },
      { upsert: true },
    );
    return true;
  }

  async unfavoriteNFTCollection(
    body: CollectionAddressDto,
    user: string,
  ): Promise<boolean> {
    const { nftContract } = body;

    const nftCollectionDocument = await this.nftCollectionModel.findOne({
      nftContract: formattedContractAddress(nftContract),
    });

    if (!nftCollectionDocument) {
      throw new HttpException('NFT Collection not found', HttpStatus.NOT_FOUND);
    }

    const userDocument = await this.userService.getOrCreateUser(user);

    const nftCollectionFavorite = await this.nftCollectionFavoriteModel.findOne(
      {
        user: userDocument._id,
        nftCollection: nftCollectionDocument._id,
      },
    );

    if (!nftCollectionFavorite || nftCollectionFavorite.isUnFavorite) {
      throw new HttpException('Not favorited', HttpStatus.BAD_REQUEST);
    }

    await this.nftCollectionFavoriteModel.findOneAndUpdate(
      {
        user: userDocument._id,
        nftCollection: nftCollectionDocument._id,
      },
      {
        $set: {
          isUnFavorite: true,
        },
      },
      { upsert: true },
    );
    return true;
  }

  async checkFavoriteNFTCollection(
    body: CollectionAddressDto,
    user: string,
  ): Promise<boolean> {
    const { nftContract } = body;

    const nftCollectionDocument = await this.nftCollectionModel.findOne({
      nftContract: formattedContractAddress(nftContract),
    });

    if (!nftCollectionDocument) {
      throw new HttpException('NFT Collection not found', HttpStatus.NOT_FOUND);
    }

    const userDocument = await this.userService.getOrCreateUser(user);

    const nftCollectionFavorite = await this.nftCollectionFavoriteModel.findOne(
      {
        user: userDocument._id,
        nftCollection: nftCollectionDocument._id,
      },
    );

    if (!nftCollectionFavorite || nftCollectionFavorite.isUnFavorite) {
      return false;
    }

    return true;
  }

  async getFavoriteNFTCollections(query: BaseQueryParams, user: string) {
    const { page, size, skipIndex } = query;

    const userDocument = await this.userService.getOrCreateUser(user);

    const result = new BaseResultPagination<NftCollectionFavoritesDocument>();

    const filter: any = {
      user: userDocument._id,
      isUnFavorite: false,
    };

    const count = await this.nftCollectionFavoriteModel.countDocuments(filter);
    if (count === 0 || size === 0) {
      result.data = new PaginationDto<NftCollectionFavoritesDocument>(
        [],
        count,
        page,
        size,
      );
      return result;
    }

    const now = Date.now();
    const sortOperators = {};
    for (const items of query.sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }
    const items = await this.nftCollectionFavoriteModel
      .find(filter)
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .populate([
        {
          path: 'nftCollection',
          select: [
            'name',
            'nftContract',
            'standard',
            'owner',
            'avatar',
            'cover',
            'description',
            'symbol',
          ],
        },
      ]);

    result.data = new PaginationDto<NftCollectionFavoritesDocument>(
      items,
      count,
      page,
      size,
    );

    return result;
  }
}
