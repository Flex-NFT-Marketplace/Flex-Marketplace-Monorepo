import {
  QuestProcess,
  Signature,
  SignatureSchema,
  SpinHistory,
  SpinHistorySchema,
  SpinRewardSchema,
  SpinRewards,
  SpinTicket,
  SpinTicketSchema,
  UserSchema,
  Users,
  questProcessSchema,
} from '@app/shared/models';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpinController } from './spin.controller';
import { SpinService } from './spin.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SpinRewards.name,
        schema: SpinRewardSchema,
      },
      {
        name: SpinTicket.name,
        schema: SpinTicketSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: QuestProcess.name,
        schema: questProcessSchema,
      },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
      {
        name: SpinHistory.name,
        schema: SpinHistorySchema,
      },
    ]),
  ],
  controllers: [SpinController],
  providers: [SpinService, UserService],
})
export class SpinModule {}
