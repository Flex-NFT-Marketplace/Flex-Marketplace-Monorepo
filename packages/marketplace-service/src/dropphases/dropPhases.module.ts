import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  ChainSchema,
  Chains,
  DropPhaseSchema,
  DropPhases,
  NftCollectionSchema,
  NftCollections,
  Signature,
  SignatureSchema,
  UserSchema,
  Users,
} from '@app/shared/models';
import { DropPhaseService } from './dropPhases.service';
import { DropPhaseController } from './dropPhases.controller';
import { UserService } from '../user/user.service';
import { Web3Service } from '@app/web3-service/web3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DropPhases.name, schema: DropPhaseSchema },
      { name: Users.name, schema: UserSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
      { name: Chains.name, schema: ChainSchema },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
    ]),
  ],
  providers: [DropPhaseService, UserService, Web3Service],
  controllers: [DropPhaseController],
})
export class DropPhaseModule {}
