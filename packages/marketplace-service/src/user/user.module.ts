import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import {
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
  Signature,
  SignatureSchema,
  UserSchema,
  Users,
} from '@app/shared/models';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/shared/modules';
import { SignatureService } from '../signature/signature.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
      {
        name: Nfts.name,
        schema: NftSchema,
      },
      {
        name: NftCollections.name,
        schema: NftCollectionSchema,
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UsersController],
  providers: [UserService, JwtStrategy, SignatureService],
  exports: [UserService],
})
export class UsersModule {}
