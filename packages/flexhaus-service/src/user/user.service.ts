import { InjectModel } from '@nestjs/mongoose';
import {
  ChainDocument,
  Chains,
  FlexHausPayment,
  FlexHausPaymentDocument,
  FlexHausSubscription,
  FlexHausSubscriptionDocument,
  UserDocument,
  Users,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';
import { SubscribeDTO } from './dto/subscribe.dto';
import { QuerySubscriberDto } from './dto/querySubscriber.dto';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { stark, ec, CallData, hash } from 'starknet';
import { decryptData, encryptData } from '@app/shared/utils/encode';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(FlexHausSubscription.name)
    private subscriptionModel: Model<FlexHausSubscriptionDocument>,
    @InjectModel(FlexHausPayment.name)
    private paymentModel: Model<FlexHausPaymentDocument>,
    @InjectModel(Chains.name)
    private chainModel: Model<ChainDocument>,
  ) {}

  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    let user = await this.userModel.findOne(
      {
        address: formatAddress,
      },
      { privateKey: 0 },
    );
    if (!user) {
      const newUser: Users = {
        address: formatAddress,
        username: formatAddress,
        nonce: uuidv1(),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
  async updateRandomNonce(address: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(address);

    const user = await this.userModel
      .findOneAndUpdate(
        { address: formatAddress },
        { $set: { nonce: uuidv1() } },
        { new: true },
      )
      .exec();

    return user;
  }

  async getUser(address: string): Promise<UserDocument> {
    return await this.userModel.findOne({
      address: formattedContractAddress(address),
    });
  }

  async updatePoints(userAddress: string, newPoints: number) {
    const newUser = await this.userModel.findOneAndUpdate(
      {
        address: formattedContractAddress(userAddress),
      },
      {
        $set: {
          points: newPoints,
        },
      },
      { new: true, upsert: true },
    );

    return newUser;
  }

  async subscribe(userAddress: string, body: SubscribeDTO) {
    const { creator } = body;
    const formatAddress = formattedContractAddress(creator);
    if (formatAddress !== userAddress) {
      throw new HttpException(
        'You are not allowed to subscribe yourself',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.getOrCreateUser(userAddress);
    const creatorUser = await this.getOrCreateUser(creator);
    const subscription = await this.subscriptionModel.findOne({
      user: user,
      creator: creatorUser,
    });

    if (subscription && !subscription.isUnSubscribe) {
      throw new HttpException(
        'You are already subscribed',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.subscriptionModel.findOneAndUpdate(
      {
        user: user,
        creator: creatorUser,
      },
      {
        $set: {
          user: user,
          creator: creatorUser,
          isUnSubscribe: false,
        },
      },
      {
        upsert: true,
      },
    );
  }

  async unSubscribe(userAddress: string, body: SubscribeDTO) {
    const { creator } = body;
    const formatAddress = formattedContractAddress(creator);
    if (formatAddress !== userAddress) {
      throw new HttpException(
        'You are not allowed to unsubscribe yourself',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.getOrCreateUser(userAddress);
    const creatorUser = await this.getOrCreateUser(creator);
    const subscription = await this.subscriptionModel.findOne({
      user: user,
      creator: creatorUser,
    });

    if (!subscription || subscription.isUnSubscribe) {
      throw new HttpException('You are not subscribed', HttpStatus.BAD_REQUEST);
    }

    return await this.subscriptionModel.findOneAndUpdate(
      {
        user: user,
        creator: creatorUser,
      },
      {
        $set: {
          user: user,
          creator: creatorUser,
          isUnSubscribe: true,
        },
      },
      {
        upsert: true,
      },
    );
  }

  async checkSubscribed(userAddress: string, creatorAddress: string) {
    const formatAddress = formattedContractAddress(creatorAddress);
    if (formatAddress !== userAddress) {
      throw new HttpException(
        'You are not allowed to check subscribed',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.getOrCreateUser(userAddress);
    const creatorUser = await this.getOrCreateUser(creatorAddress);
    const subscription = await this.subscriptionModel.findOne({
      user: user,
      creator: creatorUser,
    });

    if (!subscription || subscription.isUnSubscribe) {
      return false;
    }

    return true;
  }

  async getTotalSubscription(creatorAddress: string) {
    const formatAddress = formattedContractAddress(creatorAddress);
    const creatorUser = await this.getOrCreateUser(formatAddress);
    return await this.subscriptionModel.countDocuments({
      creator: creatorUser,
      isUnSubscribe: false,
    });
  }

  async getSubscribers(query: QuerySubscriberDto) {
    const { creator, page, size, orderBy, skipIndex } = query;
    const result = new BaseResultPagination<FlexHausSubscription>();
    const formatAddress = formattedContractAddress(creator);
    const creatorUser = await this.getOrCreateUser(formatAddress);

    const total = await this.subscriptionModel.countDocuments({
      creator: creatorUser,
      isUnSubscribe: false,
    });

    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.subscriptionModel
      .find({
        creator: creatorUser,
        isUnSubscribe: false,
      })
      .sort(orderBy)
      .skip(skipIndex)
      .limit(size)
      .populate([
        {
          path: 'creator',
          select: [
            'address',
            'username',
            'email',
            'avatar',
            'cover',
            'isVerified',
          ],
        },
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async getOrGeneratePaymentWallet(creatorAddress: string) {
    const creatorUser = await this.getOrCreateUser(creatorAddress);
    const now = Date.now();

    const payment = await this.paymentModel.findOne(
      {
        user: creatorUser,
        deadline: { $gt: now },
      },
      { _id: 1, address: 1, deadline: 1 },
    );

    if (payment) {
      return payment;
    }

    const newPrivatekey = stark.randomAddress();
    const encryptedPrivateKey = encryptData(newPrivatekey);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(newPrivatekey);
    const chain = await this.chainModel.findOne();
    const AXConstructorCallData = CallData.compile({
      owner: starkKeyPubAX,
      guardian: '0',
    });

    console.log();

    const AXcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPubAX,
      chain.walletClassHash,
      AXConstructorCallData,
      0,
    );

    const newPayemnt = new this.paymentModel({
      user: creatorUser,
      address: formattedContractAddress(AXcontractAddress),
      privateKey: encryptedPrivateKey,
      deadline: Date.now() + 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
    });

    await newPayemnt.save();
    return await this.paymentModel.findById(newPayemnt._id, {
      _id: 1,
      address: 1,
      deadline: 1,
    });
  }
}
