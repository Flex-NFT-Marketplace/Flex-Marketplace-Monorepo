import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  ChainDocument,
  Chains,
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
import {
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
      filter.nftContract = formattedContractAddress(query.nftContract);
    }

    const now = Date.now();

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

    console.log(`${Date.now() - now} ms`);

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

  async updateCollectionMetadatas(nftContract: string) {
    const totalNFts = await this.nftModel.countDocuments({ nftContract });
    const chainDocument = await this.chainModel.findOne();

    const provider = this.web3Service.getProvider(chainDocument.rpc);

    const size = 20;
    const totalPages = Math.ceil((1.0 * totalNFts) / size);
    let page = 1;
    let txSet: string[] = [];
    while (page <= totalPages) {
      const targetSet: string[] = [];
      const histories = await this.historyModel.find(
        {
          nftContract,
          type: HistoryType.Mint,
        },
        {},
        { skip: size * (page - 1), limit: 20 },
      );

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
  }

  async getTotalOwners(nftContract: string): Promise<NFTCollectionSuply> {
    const now = Date.now();
    const totalOwners = await this.nftModel.aggregate([
      {
        $match: {
          nftContract,
          isBurned: false,
        },
      },
      {
        $group: {
          _id: '$owner',
          totalNFT: {
            $sum: 1,
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
    console.log(`${Date.now() - now} ms`);

    return totalOwners[0];
  }
}
