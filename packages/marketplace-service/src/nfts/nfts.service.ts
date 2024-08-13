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

@Injectable()
export class NftService {
  constructor(
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
    private readonly userService: UserService,
    private readonly metadataService: MetadataService,
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
        const user = this.userService.getOrCreateUser(
          formattedContractAddress(query.owner),
        );
        if (user) {
          filter.owner = (await user)._id;
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
    if (query.attributes) {
      filter = {
        $and: [
          filter,
          {
            $and: query.attributes.map(attr => ({
              'attributes.value': attr.value,
              'attributes.trait_type': attr.trait_type,
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

    const items = await this.nftModel
      .find(filter)
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
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
      ])
      .exec();

    const afterAlterItem = [];
    await arraySliceProcess(
      items,
      async slicedItems => {
        await Promise.all(
          slicedItems.map(async item => {
            if (item.image === undefined) {
              try {
                const newItem = await this.metadataService.loadMetadata(
                  item._id,
                );
                if (newItem) {
                  afterAlterItem.push(newItem);
                } else {
                  afterAlterItem.push(item);
                }
              } catch (error) {
                afterAlterItem.push(item);
              }
            } else {
              afterAlterItem.push(item);
            }

            if (typeof item.tokenId === 'number') {
              item.tokenId = String(item.tokenId);
              await item.save();
            }
          }),
        );
      },
      20,
    );

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
    const filter: any = {
      nftContract: formattedContractAddress(nftContract),
      $or: [{ tokenId }, { tokenId: Number(tokenId) }],
    };

    if (query.owner) {
      if (isValidObjectId(query.owner)) {
        filter.owner = query.owner;
      } else {
        const user = this.userService.getOrCreateUser(
          formattedContractAddress(query.owner),
        );
        if (user) {
          filter.owner = (await user)._id;
        }
      }
    }

    const items = await this.nftModel.aggregate([
      { $match: filter },
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
    ]);

    if (items.length === 0) {
      throw new HttpException('Nft not found', HttpStatus.NOT_FOUND);
    }

    const item = items[0];
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
    return new BaseResult(item as NftDto);
  }
}
