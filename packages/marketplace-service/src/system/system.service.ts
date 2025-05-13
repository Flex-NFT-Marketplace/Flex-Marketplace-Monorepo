import {
  NftCollectionDocument,
  NftCollections,
  PaymentTokenDocument,
  PaymentTokens,
  System,
  SystemDocument,
} from '@app/shared/models';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingBannerCollectionDto } from './dto/settingSystem.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export class SystemService {
  constructor(
    @InjectModel(System.name)
    private readonly systemModel: Model<SystemDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionsModel: Model<NftCollectionDocument>,
    @InjectModel(PaymentTokens.name)
    private readonly paymentTokensModel: Model<PaymentTokenDocument>,
  ) {}
  async getBannerTop() {
    const system = await this.systemModel
      .findOne()
      .populate({
        path: 'nftCollectionBanner',
        select:
          'nftContract nftCollectionStats name symbol avatar cover description standard',
        populate: {
          path: 'nftCollectionStats',
        },
      })
      .exec();

    if (system) {
      return system;
    }
    // if (!system) {
    //   const dataT = {
    //     name: 'system',
    //     nftCollectionBanner: [],
    //     nftCollectionTrending: [],
    //   };
    //   await this.systemModel.create(dataT);
    // }
    return [];
  }

  async settingBannerTop(data: SettingBannerCollectionDto) {
    const system = await this.systemModel.findOne();

    if (system) {
      const nftCollectionBanner = data.nftCollectionBanner.map(address =>
        address.toLowerCase(),
      );
      console.log('nftCollectionBanner: ', nftCollectionBanner);
      const nftCollection = await this.nftCollectionsModel
        .find({
          nftContract: {
            $in: nftCollectionBanner,
          }, // Match contract addresses
        })
        .exec();

      // console.log('New nftCollection: ', nftCollection);

      // Ensure `system.nftCollectionBanner` is initialized as an array
      system.nftCollectionBanner = Array.isArray(system.nftCollectionBanner)
        ? system.nftCollectionBanner
        : [];

      const dataList = [];
      nftCollection.forEach(nft => {
        dataList.push(nft);
      });

      const result = await this.systemModel
        .findOneAndUpdate(
          {
            _id: system._id,
          },
          {
            nftCollectionBanner: dataList,
          },
          {
            new: true,
            upsert: true,
          },
        )
        .exec();

      return result.nftCollectionBanner;
    } else {
      throw new Error('System not found'); // Handle case where system is undefined
    }
  }

  async getPaymentToken(paymentToken: string) {
    const paymentTokenDocument = await this.paymentTokensModel.findOne({
      _id: paymentToken,
    });

    if (!paymentTokenDocument) {
      throw new HttpException('Payment Token not found', HttpStatus.NOT_FOUND);
    }

    return paymentTokenDocument;
  }
}
