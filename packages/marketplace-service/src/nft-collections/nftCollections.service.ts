import { InjectModel } from '@nestjs/mongoose';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ChainDocument,
  Chains,
  Histories,
  HistoryDocument,
  HistoryType,
  NftCollectionDocument,
  NftCollectionDto,
  NftCollections,
  Nfts,
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

    const items = await this.nftCollectionModel
      .find(filter)
      .sort(sort)
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
      ]);

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
    let txSet: string[] = [];
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
    owner: string,
    body: UpdateCollectionDetailDto,
  ): Promise<BaseResult<string>> {
    const ownerDocument = await this.userService.getOrCreateUser(owner);

    const { nftContract, description, externalLink, avatar, cover } = body;

    const formatedAddress = formattedContractAddress(nftContract);
    let nftCollection: NftCollectionDocument;
    await retryUntil(
      async () => {
        nftCollection = await this.nftCollectionModel.findOne({
          nftContract: formatedAddress,
          owner: ownerDocument,
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
}
