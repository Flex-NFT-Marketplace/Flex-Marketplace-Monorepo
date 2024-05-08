import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Histories,
  HistorySchema,
  NftSchema,
  Nfts,
  UserSchema,
  Users,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Histories.name, schema: HistorySchema },
      { name: Users.name, schema: UserSchema },
      { name: Nfts.name, schema: NftSchema },
    ]),
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}
