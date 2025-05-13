import { PassportModule } from '@nestjs/passport';
import {
  Chains,
  ChainSchema,
  NftCollections,
  NftCollectionSchema,
  PaymentTokens,
  PaymentTokenSchema,
  System,
  SystemSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemController } from './system.controller';
import { JwtAdminStrategy } from '@app/shared/modules';
import { SystemService } from './system.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },

      { name: Chains.name, schema: ChainSchema },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
      {
        name: System.name,
        schema: SystemSchema,
      },
      {
        name: PaymentTokens.name,
        schema: PaymentTokenSchema,
      },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt-admin' }),
  ],
  controllers: [SystemController],
  providers: [JwtAdminStrategy, SystemService],
})
export class SystemModule {}
