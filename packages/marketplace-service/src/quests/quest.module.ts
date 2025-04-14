import { Module } from '@nestjs/common';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FlexHausDonates,
  FlexHausDrop,
  FlexHausDropSchema,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleSchema,
  QuestProcess,
  QuestSchema,
  Quests,
  Signature,
  SignatureSchema,
  UserSchema,
  Users,
  flexHausDonateSchema,
  questProcessSchema,
} from '@app/shared/models';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Quests.name,
        schema: QuestSchema,
      },
      {
        name: QuestProcess.name,
        schema: questProcessSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Signature.name,
        schema: SignatureSchema,
      },
      {
        name: FlexHausSecureCollectible.name,
        schema: FlexHausSecureCollectibleSchema,
      },
      {
        name: FlexHausDonates.name,
        schema: flexHausDonateSchema,
      },
      {
        name: FlexHausDrop.name,
        schema: FlexHausDropSchema,
      },
    ]),
  ],
  controllers: [QuestController],
  providers: [QuestService, UserService],
})
export class QuestModule {}
