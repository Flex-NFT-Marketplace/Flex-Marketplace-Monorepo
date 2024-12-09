import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FlexHausDrop,
  FlexHausDropDocument,
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
import { AddCollectible } from './dto/addCollectible';

@Injectable()
export class FlexDropService {
  constructor(
    @InjectModel(FlexHausSet.name)
    private readonly flexHausSetModel: Model<FlexHausSetDocument>,
    @InjectModel(FlexHausDrop.name)
    private readonly flexHausDropModel: Model<FlexHausDropDocument>,
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

  async addCollectible(
    user: string,
    body: AddCollectible,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    const { setId, collectible } = body;

    const userDocument = await this.userService.getOrCreateUser(user);
    const set = await this.flexHausSetModel.findOne({
      _id: setId,
      creator: userDocument,
    });
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }

    const collectibleDocument = await this.nftCollectionModel.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    set.collectibles.push(collectibleDocument);

    return await this.flexHausSetModel.findOneAndUpdate(
      { _id: setId, creator: userDocument },
      { $set: { collectibles: set.collectibles } },
      { new: true },
    );
  }

  async removeCollectible(
    user: string,
    body: AddCollectible,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    const { setId, collectible } = body;

    const userDocument = await this.userService.getOrCreateUser(user);
    const set = await this.flexHausSetModel
      .findOne({
        _id: setId,
        creator: userDocument,
      })
      .populate([{ path: 'collectibles', select: ['nftContract'] }]);
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }

    const collectibleDocument = await this.nftCollectionModel.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    if (
      !set.collectibles.find(
        i => i.nftContract === collectibleDocument.nftContract,
      )
    ) {
      throw new HttpException(
        'Collectible not found from set',
        HttpStatus.NOT_FOUND,
      );
    }

    set.collectibles = set.collectibles.filter(
      i => i.nftContract !== collectibleDocument.nftContract,
    );

    await this.flexHausDropModel.findOneAndUpdate(
      { collectible: collectibleDocument },
      { $set: { set: null } },
    );

    return await this.flexHausSetModel.findOneAndUpdate(
      { _id: setId, creator: userDocument },
      { $set: { collectibles: set.collectibles } },
      { new: true },
    );
  }

  async getSetById(id: string): Promise<BaseResult<FlexHausSetDocument>> {
    const set = await this.flexHausSetModel.findOne({ _id: id }).populate([
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
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }
    return new BaseResult(set);
  }
}
