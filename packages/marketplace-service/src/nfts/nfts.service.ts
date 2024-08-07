import { InjectModel } from '@nestjs/mongoose';
import { NftDocument, NftDto, Nfts } from '@app/shared/models';

import { PaginationDto } from '@app/shared/types/pagination.dto';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import {
  isValidObjectId,
  formattedContractAddress,
  arraySliceProcess,
} from '@app/shared/utils';
import { NftFilterQueryParams } from './dto/nftQuery.dto';
import { BaseResultPagination } from '@app/shared/types';
import { MetadataService } from '@app/offchain-worker/src/metadata/metadata.service';
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
}
//.populate(['owner', 'nftCollection'])
