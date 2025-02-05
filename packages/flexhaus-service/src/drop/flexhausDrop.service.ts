import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FlexHausDrop,
  FlexHausDropDocument,
  FlexHausEventDocument,
  FlexHausEvents,
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
    @InjectModel(FlexHausEvents.name)
    private readonly flexHausEventModel: Model<FlexHausEventDocument>,
    private readonly userService: UserService,
  ) {}

  async createNewSet(
    user: string,
    body: CreateSetDto,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    const { collectible, startTime, expiryTime } = body;
    const formatedCollectible = formattedContractAddress(collectible);
    const creatorDocument = await this.userService.getOrCreateUser(user);

    let eventDocument: FlexHausEventDocument = null;
    if (body.eventId) {
      eventDocument = await this.flexHausEventModel.findOne({
        _id: body.eventId,
        creator: creatorDocument,
        isCancelled: false,
      });

      if (!eventDocument) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }

      if (Number(expiryTime) < eventDocument.snapshotTime) {
        throw new HttpException(
          'Expiry time must be greater than snapshot time',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

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

    const set = await this.flexHausSetModel.findOne({
      collectibles: { $in: [collectibleDocument] },
    });

    if (set) {
      throw new HttpException(
        'Collectible already has a set',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newSet = new this.flexHausSetModel({
      collectibles: [collectibleDocument],
      startTime: Number(startTime),
      expiryTime: Number(expiryTime),
      creator: creatorDocument,
      event: eventDocument,
    });
    const setDocument = await newSet.save();

    return new BaseResult(setDocument);
  }

  async getSets(
    query: GetFlexHausSetDto,
  ): Promise<BaseResultPagination<FlexHausSetDocument>> {
    const { page, size, skipIndex, sort } = query;
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
      filter.creator = user._id;
    }

    let total = 0;
    if (query.isCancelled !== undefined) {
      const count = await this.flexHausSetModel.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$isCancelled', query.isCancelled] },
                },
              },
            ],
            as: 'event',
          },
        },
        {
          $unwind: { path: '$event', preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: 0,
            total: {
              $sum: 1,
            },
          },
        },
      ]);

      total = count.length > 0 ? count[0].total : 0;
    } else {
      total = await this.flexHausSetModel.countDocuments(filter);
    }

    if (total == 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const sortOperators = {};
    for (const items of sort) {
      sortOperators[items[0]] = items[1];
    }

    console.log(filter, sortOperators);

    const items = await this.flexHausSetModel.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          pipeline:
            query.isCancelled !== undefined
              ? [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$isCancelled', query.isCancelled],
                      },
                    },
                  },
                ]
              : [],
          as: 'event',
        },
      },
      {
        $unwind: { path: '$event', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: sortOperators,
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: size,
      },
      {
        $lookup: {
          from: 'nftcollections',
          localField: 'collectibles',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                name: 1,
                symbol: 1,
                key: 1,
                nftContract: 1,
                cover: 1,
                avatar: 1,
                featuredImage: 1,
                description: 1,
                attributesMap: 1,
                standard: 1,
                status: 1,
                verified: 1,
                externalLink: 1,
                dropAmount: 1,
                rarity: 1,
              },
            },
          ],
          as: 'collectibles',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                address: 1,
                username: 1,
                email: 1,
                avatar: 1,
                cover: 1,
                about: 1,
                socials: 1,
                isVerified: 1,
              },
            },
          ],
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
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
    const set = await this.flexHausSetModel
      .findOne({
        _id: setId,
        creator: userDocument,
      })
      .populate(['event']);
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }

    if (set.event.isCancelled) {
      throw new HttpException('Event is cancelled', HttpStatus.BAD_REQUEST);
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
      .populate(['event'])
      .populate([{ path: 'collectibles', select: ['nftContract'] }]);
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }

    if (set.event.isCancelled) {
      throw new HttpException('Event is cancelled', HttpStatus.BAD_REQUEST);
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
          'dropAmount',
          'rarity',
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
        path: 'event',
      },
    ]);
    if (!set) {
      throw new HttpException('Set not found', HttpStatus.NOT_FOUND);
    }
    return new BaseResult(set);
  }
}
