import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GetCollectiblesDto } from './dto/queryCollectibles.dto';
import { BaseResultPagination } from '@app/shared/types';
import {
  ChainDocument,
  Chains,
  FlexHausDrop,
  FlexHausDropDocument,
  FlexHausDropType,
  FlexHausLike,
  FlexHausLikeDocument,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleDocument,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import {
  formattedContractAddress,
  getProofClaimCollectibleMessage,
} from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { CollectibleDto } from './dto/collectible.dto';
import { GetSecuredCollectiblesDto } from './dto/querySecuredCollectibles.dto';
import { GetDistributedCollectiblesDto } from './dto/queryDistributedCollectibles.dto';
import { ClaimCollectibleDto } from './dto/claimCollectible.dto';
import { Web3Service } from '@app/web3-service/web3.service';
import { stark } from 'starknet';
import configuration from '@app/shared/configuration';
import { FilterDrops } from '@app/shared/types/enum.type';

@Injectable()
export class CollectibleService {
  constructor(
    @InjectModel(NftCollections.name)
    private collectible: Model<NftCollectionDocument>,
    @InjectModel(FlexHausDrop.name)
    private flexHausDrop: Model<FlexHausDropDocument>,
    @InjectModel(FlexHausLike.name)
    private flexHausLike: Model<FlexHausLikeDocument>,
    @InjectModel(FlexHausSecureCollectible.name)
    private flexHausSecureCollectibleModel: Model<FlexHausSecureCollectible>,
    @InjectModel(Chains.name)
    private chainModel: Model<ChainDocument>,
    private web3Service: Web3Service,
    private userService: UserService,
  ) {}

  async getCollectibles(
    query: GetCollectiblesDto,
  ): Promise<BaseResultPagination<FlexHausDropDocument>> {
    const { page, size, sort, skipIndex, filterBy } = query;
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
      filter.collectible = collectible._id;
    }

    if (query.creator) {
      const creatorAccount = await this.userService.getOrCreateUser(
        query.creator,
      );
      filter.creator = creatorAccount._id;
    }

    if (query.isHaveSet !== undefined) {
      filter.set = query.isHaveSet == true ? { $ne: null } : { $eq: null };
    } else {
      filter.set = { $ne: null };
    }

    const filterDrop: any = {};
    if (filterBy) {
      const now = Date.now();
      switch (filterBy) {
        case FilterDrops.UPCOMING:
          filterDrop.startTime = { $gt: now };
          break;
        case FilterDrops.ONGOING:
          filterDrop.startTime = { $lte: now };
          filterDrop.endTime = { $gt: now };
          break;
        case FilterDrops.DISTRIBUTED:
          filterDrop.isDistributed = true;
          break;
      }
    }

    let total = 0;

    if (Object.keys(filterDrop).length === 0) {
      total = await this.flexHausDrop.countDocuments(filter);
    } else {
      let items = await this.flexHausDrop.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: 'flexhaussets',
            localField: 'set',
            foreignField: '_id',
            pipeline: [
              {
                $match: filterDrop,
              },
            ],
            as: 'set',
          },
        },
        {
          $unwind: '$set',
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

      if (items.length > 0) {
        total = items[0].total;
      }
    }
    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }

    const items = await this.flexHausDrop.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'flexhaussets',
          localField: 'set',
          foreignField: '_id',
          pipeline: [
            {
              $match: filterDrop,
            },
          ],
          as: 'set',
        },
      },
      {
        $unwind: '$set',
      },
      {
        $sort: sortOperators,
      },
      { $skip: skipIndex },
      { $limit: size },
      {
        $lookup: {
          from: 'nftcollections',
          localField: 'collectible',
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
          as: 'collectible',
        },
      },
      {
        $unwind: '$collectible',
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
      {
        $unwind: '$creator',
      },
    ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async likeCollectible(query: CollectibleDto, user: string) {
    const userDocument = await this.userService.getOrCreateUser(user);
    const collectible = await this.collectible.findOne({
      nftContract: formattedContractAddress(query.collectible),
      isFlexHausCollectible: true,
    });

    if (!collectible) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const like = await this.flexHausLike.findOne({
      user: userDocument,
      collectible: collectible,
    });

    if (like && !like.isUnLike) {
      throw new HttpException('Already liked', HttpStatus.BAD_REQUEST);
    }

    const newLike = await this.flexHausLike.findOneAndUpdate(
      {
        user: userDocument,
        collectible: collectible,
      },
      {
        isUnLike: false,
      },
      { upsert: true, new: true },
    );

    return newLike;
  }

  async unlikeCollectible(query: CollectibleDto, user: string) {
    const userDocument = await this.userService.getOrCreateUser(user);
    const collectible = await this.collectible.findOne({
      nftContract: formattedContractAddress(query.collectible),
      isFlexHausCollectible: true,
    });

    if (!collectible) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const like = await this.flexHausLike.findOne({
      user: userDocument,
      collectible: collectible,
    });

    if (!like || like.isUnLike) {
      throw new HttpException('Not liked', HttpStatus.BAD_REQUEST);
    }

    like.isUnLike = true;
    return await like.save();
  }

  async isLiked(query: CollectibleDto, user: string) {
    const { collectible } = query;
    const userDocument = await this.userService.getOrCreateUser(user);

    const collectibleDocument = await this.collectible.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const like = await this.flexHausLike.findOne({
      user: userDocument,
      collectible: collectibleDocument,
    });

    if (!like) {
      return false;
    }

    return !like.isUnLike;
  }

  async isSecured(query: CollectibleDto, user: string) {
    const { collectible } = query;
    const userDocument = await this.userService.getOrCreateUser(user);

    const collectibleDocument = await this.collectible.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const securedCollectible =
      await this.flexHausSecureCollectibleModel.findOne({
        user: userDocument,
        collectible: collectibleDocument,
      });

    if (!securedCollectible || !securedCollectible.isSecured) {
      return false;
    }

    return true;
  }

  async getTotalLikes(query: CollectibleDto) {
    const { collectible } = query;
    const collectibleDocument = await this.collectible.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const likes = await this.flexHausLike.countDocuments({
      collectible: collectibleDocument,
      isUnLike: false,
    });

    return likes;
  }

  async secureCollectible(param: CollectibleDto, user: string) {
    const { collectible } = param;

    const collectibleDocument = await this.collectible
      .findOne({
        nftContract: formattedContractAddress(collectible),
        isFlexHausCollectible: true,
      })
      .populate([{ path: 'owner', select: ['address'] }]);

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const collectibleDrop = await this.flexHausDrop
      .findOne({
        collectible: collectibleDocument,
        set: { $ne: null },
      })
      .populate([{ path: 'set' }]);

    if (!collectibleDrop) {
      throw new HttpException(
        'Collectible Drop not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (collectibleDrop.set.expiryTime < Date.now()) {
      throw new HttpException(
        'Collectible Drop has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userDocument = await this.userService.getOrCreateUser(user);

    if (
      !userDocument.points ||
      collectibleDrop.dropType === FlexHausDropType.Free ||
      userDocument.points < Number(collectibleDrop.secureAmount)
    ) {
      throw new HttpException(
        'You do not have enough permission to secure this collectible',
        HttpStatus.BAD_REQUEST,
      );
    }

    const flexHausSecureCollectible =
      await this.flexHausSecureCollectibleModel.findOne({
        user: userDocument._id,
        collectible: collectibleDocument._id,
      });

    if (flexHausSecureCollectible) {
      throw new HttpException(
        'You have already secured this collectible',
        HttpStatus.BAD_REQUEST,
      );
    }

    const totalSecuredCollectibles =
      await this.flexHausSecureCollectibleModel.countDocuments({
        collectible: collectibleDocument._id,
      });

    if (totalSecuredCollectibles == collectibleDocument.dropAmount) {
      throw new HttpException(
        'Collectible Drop is full',
        HttpStatus.BAD_REQUEST,
      );
    }

    const creatorDocument = await this.userService.getOrCreateUser(
      collectibleDocument.owner.address,
    );

    await this.userService.updatePoints(
      user,
      Number(userDocument.points) - Number(collectibleDrop.secureAmount),
    );

    await this.userService.updatePoints(
      creatorDocument.address,
      Number(creatorDocument.points || 0) +
        Number(collectibleDrop.secureAmount),
    );

    const newFlexHausSecureCollectible =
      new this.flexHausSecureCollectibleModel({
        user: userDocument,
        collectible: collectibleDocument,
        isSecured: true,
      });

    await newFlexHausSecureCollectible.save();

    return true;
  }

  async getSecuredCollectibles(
    query: GetSecuredCollectiblesDto,
  ): Promise<BaseResultPagination<FlexHausSecureCollectibleDocument>> {
    const { page, size, orderBy, skipIndex, user } = query;
    const result =
      new BaseResultPagination<FlexHausSecureCollectibleDocument>();
    const filter: any = {};

    if (user) {
      const userDocument = await this.userService.getOrCreateUser(user);

      filter.user = userDocument;
    }

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

    if (query.isDistributed !== undefined) {
      filter.isDistributed = query.isDistributed;
    } else {
      filter.isDistributed = false;
    }

    filter.isSecured = true;

    const total =
      await this.flexHausSecureCollectibleModel.countDocuments(filter);
    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausSecureCollectibleModel
      .find(filter, {}, { sort: orderBy, skip: skipIndex, limit: size })
      .populate([
        {
          path: 'collectible',
          select: [
            'name',
            'symbol',
            'nftContract',
            'cover',
            'avatar',
            'featuredImage',
            'description',
            'standard',
            'dropAmount',
            'rarity',
          ],
        },
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async getDistributionCollectibles(
    query: GetDistributedCollectiblesDto,
  ): Promise<BaseResultPagination<FlexHausSecureCollectibleDocument>> {
    const { page, size, orderBy, skipIndex, user } = query;
    const result =
      new BaseResultPagination<FlexHausSecureCollectibleDocument>();
    const filter: any = {};

    if (user) {
      const userDocument = await this.userService.getOrCreateUser(user);

      filter.user = userDocument;
    }

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

    if (query.isClaimed !== undefined) {
      filter.isClaimed = query.isClaimed;
    }

    filter.isDistributed = true;

    const total =
      await this.flexHausSecureCollectibleModel.countDocuments(filter);
    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausSecureCollectibleModel
      .find(filter, {}, { sort: orderBy, skip: skipIndex, limit: size })
      .populate([
        {
          path: 'collectible',
          select: [
            'name',
            'symbol',
            'nftContract',
            'cover',
            'avatar',
            'featuredImage',
            'description',
            'standard',
            'dropAmount',
            'rarity',
          ],
        },
        {
          path: 'user',
          select: [
            'id',
            'name',
            'avatar',
            'email',
            'username',
            'bio',
            'address',
            'role',
            'isActive',
            'isVerified',
            'isAdmin',
          ],
        },
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async claimCollectible(
    query: CollectibleDto,
    user: string,
  ): Promise<ClaimCollectibleDto> {
    const { collectible } = query;

    const collectibleDocument = await this.collectible.findOne({
      nftContract: formattedContractAddress(collectible),
      isFlexHausCollectible: true,
    });

    if (!collectibleDocument) {
      throw new HttpException('Collectible not found', HttpStatus.NOT_FOUND);
    }

    const userDocument = await this.userService.getOrCreateUser(user);

    const distributedColl = await this.flexHausSecureCollectibleModel.findOne({
      user: userDocument,
      collectible: collectibleDocument,
      isDistributed: true,
    });

    if (!distributedColl) {
      throw new HttpException(
        'You have not distributed this collectible',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (distributedColl.isClaimed) {
      throw new HttpException(
        'You have already claimed this collectible',
        HttpStatus.BAD_REQUEST,
      );
    }

    const message = getProofClaimCollectibleMessage(collectible, user);
    const chainDocument = await this.chainModel.findOne();

    const signer = this.web3Service.getAccountInstance(
      configuration().flexhaus_validator.privateKey,
      configuration().flexhaus_validator.address,
      chainDocument.rpc,
    );

    const signature = await signer.signMessage(message);
    const formattedSignature = stark.formatSignature(signature);

    return {
      collectible: formattedContractAddress(collectible),
      user,
      signature: formattedSignature,
    };
  }
}
