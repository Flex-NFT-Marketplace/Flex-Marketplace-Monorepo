import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import configuration from '@app/shared/configuration';
import { AppLoggerMiddleware } from '@app/shared/middleware/app-logger.middleware';
import { NftModule } from './nfts/nfts.module';
import { NftCollectionsModule } from './nft-collections/nft-collections.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forRoot(configuration().db_path),
    NftModule,
    NftCollectionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
