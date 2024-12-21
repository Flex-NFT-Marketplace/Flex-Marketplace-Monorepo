import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import configuration from '@app/shared/configuration';
import { AppLoggerMiddleware } from '@app/shared/middleware/app-logger.middleware';
import { NftModule } from './nfts/nfts.module';
import { NftCollectionsModule } from './nft-collections/nftCollections.module';
import { HistoryModule } from './histories/history.module';
import { WalletModule } from './wallet/wallet.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DropPhaseModule } from './dropphases/dropPhases.module';
import { WarpcastModule } from './warpcast/warpcast.module';
import { SignatureModule } from './signature/signature.module';
import { SystemModule } from './system/system.module';
import { SearchModule } from './search/search.module';
import { StakingModule } from './staking/staking.module';
import { NftCollectionTaskModule } from './nft-collections/task/nftCollectionTask.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forRoot(configuration().db_path),
    NftModule,
    HistoryModule,
    WalletModule,
    NftCollectionsModule,
    DropPhaseModule,
    SignatureModule,
    WarpcastModule,
    SystemModule,
    SearchModule,
    StakingModule,
    CacheModule.register({ isGlobal: true, max: 100 }),
    ScheduleModule.forRoot(),
    NftCollectionTaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
