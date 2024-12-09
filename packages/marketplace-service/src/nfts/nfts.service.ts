import { InjectModel } from '@nestjs/mongoose';
import { NftDocument, NftDto, Nfts } from '@app/shared/models';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import {
  isValidObjectId,
  formattedContractAddress,
  arraySliceProcess,
} from '@app/shared/utils';
import { NftFilterQueryParams } from './dto/nftQuery.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { MetadataService } from '@app/offchain-worker/src/metadata/metadata.service';
import { GetNftQueryDto } from './dto/getNftQuery.dto';
import { SignatureService } from '../signature/signature.service';

@Injectable()
export class NftService {
  constructor(
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
    private readonly userService: UserService,
    private readonly metadataService: MetadataService,
    private readonly signatureService: SignatureService,
  ) {}

  async getNftsByQuery(
    query: NftFilterQueryParams,
  ): Promise<BaseResultPagination<NftDto>> {
    const result = new BaseResultPagination<NftDto>();
    let filter: any = {};
    if (query.owner) {
      if (isValidObjectId(query.owner)) {
        filter.owner = query.owner;
      } else {
        const user = await this.userService.getOrCreateUser(
          formattedContractAddress(query.owner),
        );
        if (user) {
          filter.owner = user._id;
        }
      }
    }
    if (query.nftContract) {
      filter.nftContract = formattedContractAddress(query.nftContract);
    }
    if (query.tokenId) {
      filter['$or'] = [
        { tokenId: query.tokenId },
        { tokenId: Number(query.tokenId) },
      ];
    }
    if (query.name) {
      filter.name = { $regex: `${query.name}`, $options: 'i' };
    }

    //todo add attributes filter or
    if (query.attributes) {
      filter = {
        $and: [
          filter,
          {
            $or: query.attributes.map(attr => ({
              $and: [
                { 'attributes.trait_type': attr.trait_type },
                { 'attributes.value': attr.value },
              ],
            })),
          },
        ],
      };
    }
    filter.isBurned = query.isBurned ? query.isBurned : false;
    filter.amount = { $gt: 0 };
    const count = await this.nftModel.countDocuments(filter);

    if (count === 0 || query.size === 0) {
      result.data = new PaginationDto([], count, query.page, query.size);
      return result;
    }
    const now = Date.now();

    // const items = await this.nftModel
    //   .find(filter)
    //   .sort(query.sort)
    //   .skip(query.skipIndex)
    //   .limit(query.size)
    //   .populate([
    //     {
    //       path: 'owner',
    //       select: [
    //         'address',
    //         'username',
    //         'isVerified',
    //         'email',
    //         'avatar',
    //         'cover',
    //         'about',
    //         'socials',
    //         'isVerified',
    //       ],
    //     },
    //     {
    //       path: 'creator',
    //       select: [
    //         'address',
    //         'username',
    //         'isVerified',
    //         'email',
    //         'avatar',
    //         'cover',
    //         'about',
    //         'socials',
    //         'isVerified',
    //       ],
    //     },
    //     {
    //       path: 'nftCollection',
    //       select: [
    //         'name',
    //         'symbol',
    //         'verified',
    //         'standard',
    //         'description',
    //         'avatar',
    //         'key',
    //       ],
    //     },
    //   ])
    //   .exec();
    let sortQuery = {};

    switch (query.sortPrice) {
      case 'asc':
        sortQuery = { lowest_signature_price: 1 };
        break;
      case 'desc':
        sortQuery = { lowest_signature_price: -1 };
        break;
      default:
        sortQuery = { createdAt: 1 };
    }

    // const pipeline: any[] = [
    //   {
    //     $match: filter,
    //   },
    //   {
    //     $facet: {
    //       nfts_with_signatures: [
    //         {
    //           $lookup: {
    //             from: 'signatures',
    //             let: { nft_id: '$_id' },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: { $eq: ['$nft', '$$nft_id'] },
    //                 },
    //               },
    //               {
    //                 $sort: { price: 1 },
    //               },
    //               {
    //                 $limit: 1,
    //               },
    //             ],
    //             as: 'signatures',
    //           },
    //         },
    //         {
    //           $unwind: {
    //             path: '$signatures',
    //             preserveNullAndEmptyArrays: true,
    //           },
    //         },
    //         {
    //           $match: {
    //             'signatures.status': 'LISTING',
    //             'signatures.price': {
    //               $gte: Number(query.minPrice) || 0,
    //               $lte: Number(query.maxPrice) || Number.MAX_VALUE,
    //             },
    //           },
    //         },
    //         {
    //           $lookup: {
    //             from: 'owners', // The collection where owner details are stored
    //             localField: 'owner',
    //             foreignField: '_id',
    //             as: 'ownerData',
    //           },
    //         },
    //         {
    //           $unwind: {
    //             path: '$ownerData',
    //             preserveNullAndEmptyArrays: true,
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             contract_address: '$nftContract',
    //             token_id: '$tokenId',
    //             name: 1,
    //             description: 1,
    //             external_url: 1,
    //             attributes: 1,
    //             image_url: 1,
    //             owner: '$ownerData',
    //             lowest_signature_price: '$signatures.price',
    //             signatures: '$signatures',
    //             createdAt: 1,
    //           },
    //         },
    //         {
    //           $sort: sortQuery,
    //         },
    //       ],
    //       nfts_without_signatures: [
    //         {
    //           $lookup: {
    //             from: 'signatures',
    //             localField: '_id',
    //             foreignField: 'nft',
    //             as: 'signatures',
    //           },
    //         },
    //         {
    //           $match: {
    //             signatures: { $size: 0 },
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $project: {
    //       nfts:
    //         query.status === 'LISTING'
    //           ? '$nfts_with_signatures'
    //           : {
    //               $concatArrays: [
    //                 '$nfts_with_signatures',
    //                 '$nfts_without_signatures',
    //               ],
    //             },
    //     },
    //   },
    //   { $unwind: '$nfts' },
    //   { $replaceRoot: { newRoot: '$nfts' } },
    //   { $skip: Number(query.skipIndex) || 0 },
    //   { $limit: Number(query.size) || 10 },
    // ];
    const pipeline: any[] = [
      {
        $match: filter, // Ensure `filter` is properly constructed
      },
      {
        $lookup: {
          from: 'signatures',
          let: { nft_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$nft', '$$nft_id'] },
              },
            },
            { $sort: { price: 1, updatedAt: -1 } },
            { $limit: 1 },
          ],
          as: 'signatures',
        },
      },
      {
        $unwind: {
          path: '$signatures',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerData',
        },
      },
      {
        $unwind: {
          path: '$ownerData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          nftContract: '$nftContract',
          tokenId: '$tokenId',
          name: 1,
          description: 1,
          image: 1,
          attributes: 1,
          burnedAt: 1,
          amount: 1,
          royaltyRate: 1,
          lowestPrice: '$signatures.price',
          owner: {
            username: '$ownerData.username',
            avatar: '$ownerData.avatar',
            address: '$ownerData.address',
          },
          createdAt: 1,
        },
      },
      {
        $sort: sortQuery,
      },
      { $skip: Number(query.skipIndex) || 0 },
      { $limit: Number(query.size) || 10 },
    ];

    const nfts = await this.nftModel.aggregate(pipeline);

    const afterAlterItem = [];
    try {
      await arraySliceProcess(
        nfts,
        async slicedItems => {
          await Promise.all(
            slicedItems.map(async item => {
              const currentResult: any = {
                nftData: {},
                orderData: {},
              };
              if (item.image === undefined) {
                try {
                  const newItem = await this.metadataService.loadMetadata(
                    item._id,
                  );
                  if (newItem) {
                    currentResult.nftData = newItem;
                    // afterAlterItem.push(newItem);
                  } else {
                    // afterAlterItem.push(item);
                    currentResult.nftData = item;
                  }
                } catch (error) {
                  // afterAlterItem.push(item);
                  currentResult.nftData = item;
                }
              } else {
                // afterAlterItem.push(item);
                currentResult.nftData = item;
              }

              if (typeof item.tokenId === 'number') {
                item.tokenId = String(item.tokenId);
                await item.save();
              }
              //Todo code of signatureService
              let bestAsk: any;

              if (item.owner.username != '') {
                bestAsk = await this.signatureService.getSignatureByOwner(
                  item.nftContract,
                  item.tokenId,
                  item.owner.username,
                );
              } else {
                bestAsk = await this.signatureService.getSignature(
                  item.nftContract,
                  item.tokenId,
                );
              }
              const listAsk = await this.signatureService.getSignatures(
                item.nftContract,
                item.tokenId,
              );

              const listBid = await this.signatureService.getBidSignatures(
                item.nftContract,
                item.tokenId,
              );

              const orderData = {
                bestAsk,
                listAsk,
                listBid,
              };

              // const existingItem = afterAlterItem[index] || {};
              // afterAlterItem[index] = {
              //   nftData: existingItem,
              //   orderData: orderData,
              // };
              currentResult.orderData = orderData;
              afterAlterItem.push(currentResult);
            }),
          );
        },
        query.size,
      );
    } catch (error) {
      console.log('Error Fetching', error);
    }

    result.data = new PaginationDto(
      afterAlterItem,
      count,
      query.page,
      query.size,
    );
    console.log(`finish in ${Date.now() - now} ms`);

    return result;
  }

  async getNftDetail(query: GetNftQueryDto): Promise<BaseResult<NftDto>> {
    const { nftContract, tokenId } = query;
    const currentResult: any = {
      nftData: {},
      orderData: {},
    };
    const filter: any = {
      nftContract: formattedContractAddress(nftContract),
      $or: [{ tokenId }, { tokenId: Number(tokenId) }],
    };

    let item: any;

    const items = await this.nftModel
      .find(filter)
      .limit(1)
      .populate([
        {
          path: 'owner',
          select: 'address username isVerified',
        },
        {
          path: 'creator',
          select: 'address username isVerified',
        },
        {
          path: 'nftCollection',
          select: [
            'name',
            'symbol',
            'verified',
            'standard',
            'description',
            'avatar',
            'key',
          ],
        },
      ]);

    if (items.length === 0) {
      item = (
        await this.nftModel.aggregate([
          {
            $match: {
              nftContract: formattedContractAddress(nftContract),
              $or: [{ tokenId }, { tokenId: Number(tokenId) }],
            },
          },
          { $limit: 1 },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    address: 1,
                  },
                },
              ],
              as: 'owner',
            },
          },
          { $unwind: '$owner' },
          {
            $lookup: {
              from: 'nftcollections',
              localField: 'nftCollection',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    symbol: 1,
                    verified: 1,
                    standard: 1,
                    description: 1,
                    avatar: 1,
                    key: 1,
                  },
                },
              ],
              as: 'nftCollection',
            },
          },
          { $unwind: '$nftCollection' },
          {
            $project: {
              // Include all fields from the root document
              root: '$$ROOT',
              // Add or modify specific fields
              owner: '$owner.address',
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ['$root', { owner: '$owner' }],
              },
            },
          },
        ])
      )[0];

      if (!item) {
        throw new HttpException('Nft not found', HttpStatus.NOT_FOUND);
      }
    } else {
      item = items[0];
    }

    if (typeof item.tokenId === 'number') {
      item.tokenId = String(item.tokenId);
      await this.nftModel.findOneAndUpdate(
        { _id: item._id },
        { $set: { tokenId: item.tokenId } },
        { new: true },
      );
    }

    if (item.image === undefined) {
      try {
        const newItem = await this.metadataService.loadMetadata(item._id);
        if (newItem) {
          item.image = newItem.image;
          item.name = newItem.name;
          item.description = newItem.description;
          item.attributes = newItem.attributes;
          item.tokenUri = newItem.tokenUri;
        }
      } catch (error) {}
    }
    //Todo code of signatureService
    let bestAsk: any;

    if (query.owner != '') {
      bestAsk = await this.signatureService.getSignatureByOwner(
        query.nftContract,
        query.tokenId,
        query.owner,
      );
    } else {
      bestAsk = await this.signatureService.getSignature(
        query.nftContract,
        query.tokenId,
      );
    }

    const listAsk = await this.signatureService.getSignatures(
      query.nftContract,
      query.tokenId,
    );

    const listBid = await this.signatureService.getBidSignatures(
      query.nftContract,
      query.tokenId,
    );

    const orderData = {
      bestAsk,
      listAsk,
      listBid,
    };
    currentResult.nftData = item;
    currentResult.orderData = orderData;
    return new BaseResult(currentResult);
  }
}
