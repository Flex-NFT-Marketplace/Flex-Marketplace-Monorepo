import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CancelAllOrderQueueModule,
  CancelOfferQueueModule,
  CreatorPayoutUpdatedQueueModule,
  DeployContractQueueModule,
  Erc1155BurnQueueModule,
  Erc1155MintQueueModule,
  Erc1155TransferQueueModule,
  Erc1155UpdateMetadataQueueModule,
  Erc20TransferQueueModule,
  Erc721BurnQueueModule,
  Erc721MintQueueModule,
  Erc721TransferQueueModule,
  Erc721UpdateMetadataQueueModule,
  ItemStakedQueueModule,
  ItemUnstakedQueueModule,
  PayerUpdatedQueueModule,
  PhaseDropUpdatedQueueModule,
  TakerAskQueueModule,
  TakerBidQueueModule,
  UpdateDropQueueModule,
  UpgradeContractQueueModule,
} from './queues';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().db_path),
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        imports: [ConfigModule],
        redis: {
          host: config.get('QUEUE_HOST'),
          port: config.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    CancelAllOrderQueueModule,
    CancelOfferQueueModule,
    CreatorPayoutUpdatedQueueModule,
    DeployContractQueueModule,
    Erc721BurnQueueModule,
    Erc721MintQueueModule,
    Erc721TransferQueueModule,
    Erc1155BurnQueueModule,
    Erc1155MintQueueModule,
    Erc1155TransferQueueModule,
    PayerUpdatedQueueModule,
    PhaseDropUpdatedQueueModule,
    TakerAskQueueModule,
    TakerBidQueueModule,
    UpgradeContractQueueModule,
    Erc721UpdateMetadataQueueModule,
    Erc1155UpdateMetadataQueueModule,
    ItemStakedQueueModule,
    ItemUnstakedQueueModule,
    UpdateDropQueueModule,
    Erc20TransferQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
