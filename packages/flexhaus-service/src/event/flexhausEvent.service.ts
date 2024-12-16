import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlexHausEvents } from '@app/shared/models';
import { BaseResult } from '@app/shared/types/base.result';
import { formattedContractAddress } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { CreateEventDto } from './dto/createEvent.dto';

@Injectable()
export class FlexHausEventService {
  constructor(
    @InjectModel(FlexHausEvents.name)
    private readonly flexHausEventModel: Model<FlexHausEvents>,
    private readonly userService: UserService,
  ) {}

  async createNewEvent(
    user: string,
    body: CreateEventDto,
  ): Promise<BaseResult<FlexHausEvents>> {
    const { snapshotTime, perks, startTime } = body;

    const creatorDocument = await this.userService.getOrCreateUser(user);
    const event: FlexHausEvents = {
      creator: creatorDocument,
      perks,
      startTime,
      snapshotTime,
    };

    const eventDocument = await this.flexHausEventModel.findOneAndUpdate(
      {
        creator: creatorDocument,
      },
      { $set: event },
      { upsert: true, new: true },
    );

    return new BaseResult(eventDocument);
  }
}
