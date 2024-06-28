import { InjectModel } from '@nestjs/mongoose';
import { NftDocument, NftDto, Nfts } from '@app/shared/models';

import { PaginationDto } from '@app/shared/types/pagination.dto';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { isValidObjectId, formattedContractAddress } from '@app/shared/utils';
import { NftFilterQueryParams } from './dto/nftQuery.dto';
@Injectable()
export class NftService {
  constructor(
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
    private readonly userService: UserService,
  ) {}

  async getNftsByQuery(
    query: NftFilterQueryParams,
  ): Promise<PaginationDto<NftDto>> {
    let filter: any = {};
    if (query.owner) {
      if (isValidObjectId(query.owner)) {
        filter.owner = formattedContractAddress(query.owner);
      } else {
        const user = this.userService.getUser(
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
      filter.tokenId = query.tokenId;
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

    const count = await this.nftModel.countDocuments(filter);
    const items = await this.nftModel
      .find(filter)
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    return new PaginationDto(items, count, query.page, query.size);
  }
}
//.populate(['owner', 'nftCollection'])
