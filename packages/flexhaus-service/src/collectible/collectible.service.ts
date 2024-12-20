import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GetCollectiblesDto } from './dto/queryCollectibles.dto';
import { BaseResultPagination } from '@app/shared/types';
import {
  FlexHausDrop,
  FlexHausDropDocument,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import { formattedContractAddress } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';

@Injectable()
export class CollectibleService {
  constructor(
    @InjectModel(NftCollections.name)
    private collectible: Model<NftCollectionDocument>,
    @InjectModel(FlexHausDrop.name)
    private flexHausDrop: Model<FlexHausDropDocument>,
    private userService: UserService,
  ) {}

  async getCollectibles(
    query: GetCollectiblesDto,
  ): Promise<BaseResultPagination<FlexHausDropDocument>> {
    const { page, size, orderBy, skipIndex } = query;
    const result = new BaseResultPagination<FlexHausDropDocument>();
    const filter: any = {};

    if (query.collectible) {
      const collectible = await this.collectible.findOne({
        nftContract: formattedContractAddress(query.collectible),
        isFlexHausCollectible: true,
      });
      if (!collectible) {
        throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
      }
      filter.collectible = collectible;
    }

    if (query.creator) {
      const creatorAccount = await this.userService.getOrCreateUser(
        query.creator,
      );
      filter.creator = creatorAccount;
    }

    if (query.isHaveSet === undefined) {
      filter.set = { $ne: null };
    } else {
      filter.set = query.isHaveSet == true ? { $ne: null } : { $eq: null };
    }

    const total = await this.flexHausDrop.countDocuments(filter);
    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausDrop
      .find(filter, {}, { sort: orderBy, skip: skipIndex, limit: size })
      .populate([
        {
          path: 'collectible',
          select: [
            'name',
            'symbol',
            'key',
            'nftContract',
            'cover',
            'avatar',
            'featuredImage',
            'description',
            'attributesMap',
            'standard',
            'status',
            'verified',
            'externalLink',
          ],
        },
        {
          path: 'creator',
          select: [
            'address',
            'username',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        {
          path: 'set',
        },
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }
}
