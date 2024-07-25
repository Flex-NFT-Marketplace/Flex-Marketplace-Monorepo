import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  DropPhaseSchema,
  DropPhases,
  NftCollectionSchema,
  NftCollections,
  UserSchema,
  Users,
} from '@app/shared/models';
import { DropPhaseService } from './dropPhases.service';
import { DropPhaseController } from './dropPhases.controller';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DropPhases.name, schema: DropPhaseSchema },
      { name: Users.name, schema: UserSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
    ]),
  ],
  providers: [DropPhaseService, UserService],
  controllers: [DropPhaseController],
})
export class DropPhaseModule {}
