import { Module } from '@nestjs/common';
import { CoinPriceModule } from './coin-price/coinprice.module';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '@app/shared/configuration';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forRoot(configuration().db_path),
    ScheduleModule.forRoot(),
    CoinPriceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
