import { Module } from '@nestjs/common';
import { CoinPriceTaskService } from './task/coinpriceTask.service';
import {
  CoinPrice,
  CoinPriceSchema,
  PaymentTokens,
  PaymentTokenSchema,
} from '@app/shared/models';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CoinPrice.name,
        schema: CoinPriceSchema,
      },
      {
        name: PaymentTokens.name,
        schema: PaymentTokenSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [CoinPriceTaskService],
})
export class CoinPriceModule {}
