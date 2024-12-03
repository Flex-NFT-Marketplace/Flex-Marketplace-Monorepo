import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FlexHausSet,
  FlexHausSetDocument,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import { CreateSetDto } from './dto/createSet.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { formattedContractAddress } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { GetFlexHausSetDto } from './dto/getSet.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';

@Injectable()
export class FlexDropService {
  constructor(
    @InjectModel(FlexHausSet.name)
    private readonly flexHausSetModel: Model<FlexHausSetDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    private readonly userService: UserService,
  ) {}

  async createNewSet(
    user: string,
    body: CreateSetDto,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    const { collectible, startTime } = body;
    const formatedCollectible = formattedContractAddress(collectible);
    const filter = {};

    const collectibleDocument = await this.nftCollectionModel.findOne({
      nftContract: formatedCollectible,
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException(
        'Collectible not found, please try again.',
        HttpStatus.NOT_FOUND,
      );
    }

    const creatorDocument = await this.userService.getOrCreateUser(user);
    const newSet: FlexHausSet = {
      collectibles: [collectibleDocument],
      startTime,
      creator: creatorDocument,
    };
    const setDocument = await this.flexHausSetModel.findOneAndUpdate(
      {
        collectibles: { $in: [collectibleDocument] },
        creator: creatorDocument._id,
      },
      { $set: newSet },
      { upsert: true, new: true },
    );

    return new BaseResult(setDocument);
  }

  async getSets(
    query: GetFlexHausSetDto,
  ): Promise<BaseResultPagination<FlexHausSetDocument>> {
    const { page, size, skipIndex } = query;
    const result: BaseResultPagination<FlexHausSetDocument> =
      new BaseResultPagination();
    const filter: any = {};

    if (query.collectible) {
      const formatedAddress = formattedContractAddress(query.collectible);
      const nftCollection = await this.nftCollectionModel.findOne({
        nftContract: formatedAddress,
        isFlexHausCollectible: true,
      });

      if (!nftCollection) {
        throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
      }

      filter.collectibles = { $in: [nftCollection] };
    }

    if (query.creator) {
      const formatedAddress = formattedContractAddress(query.creator);
      const user = await this.userService.getOrCreateUser(formatedAddress);
      filter.creator = user;
    }

    const total = await this.flexHausSetModel.countDocuments(filter);
    if (total == 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausSetModel
      .find(
        filter,
        {},
        { sort: { startTime: 1 }, skip: skipIndex, limit: size },
      )
      .populate([
        {
          path: 'collectibles',
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
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }
}
