import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserSchema, Users } from '@app/shared/models';

import { UsersModule } from '../user/user.module';
import { JwtStrategy } from '@app/shared/modules';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, JwtStrategy],
})
export class WalletModule {}
