import { Injectable } from '@nestjs/common';
import { Router, RouteSuccess } from 'fibrous-router-sdk';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BigNumber } from '@ethersproject/bignumber';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CoinPrice,
  CoinPriceDocument,
  PaymentTokenDocument,
  PaymentTokens,
} from '@app/shared/models';
import { parseUnits } from 'ethers';

@Injectable()
export class CoinPriceTaskService {
  router: Router;

  constructor(
    @InjectModel(CoinPrice.name)
    private coinPriceModel: Model<CoinPriceDocument>,
    @InjectModel(PaymentTokens.name)
    private paymentTokensModel: Model<PaymentTokenDocument>,
  ) {
    this.router = new Router();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async getPrice() {
    try {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      const paymentTokens = await this.paymentTokensModel.find();
      const ethToken = await this.paymentTokensModel.findOne({
        symbol: 'ETH',
      });
      for (const paymentToken of paymentTokens) {
        if (paymentToken.contractAddress !== ethToken.contractAddress) {
          const bestBuyRoute = await this.router.getBestRoute(
            BigNumber.from(parseUnits('1', paymentToken.decimals)),
            paymentToken.contractAddress,
            ethToken.contractAddress,
            'starknet',
            { reverse: true },
          );
          const price = (bestBuyRoute as RouteSuccess).outputAmount;
          await this.coinPriceModel.findOneAndUpdate(
            {
              token0: paymentToken._id,
              token1: ethToken._id,
              timestamp: now,
            },
            { $set: { price: price } },
            { upsert: true, new: true },
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
