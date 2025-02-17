import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import configuration from '@app/shared/configuration';
import { AppLoggerMiddleware } from '@app/shared/middleware/app-logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { FlexHausDropModule } from './drop/flexhausDrop.module';
import { JwtStrategy } from '@app/shared/modules';
import { Users, UserSchema } from '@app/shared/models';
import { CollectibleModule } from './collectible/collectible.module';
import { FlexHausEventModule } from './event/flexhausEvent.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    MongooseModule.forRoot(configuration().db_path),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    FlexHausDropModule,
    CollectibleModule,
    FlexHausEventModule,
    UserModule,
    SystemModule,
  ],
  controllers: [],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
