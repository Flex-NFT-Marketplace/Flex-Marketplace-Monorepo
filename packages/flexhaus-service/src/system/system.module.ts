import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainSchema, Chains } from '@app/shared/models';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}
