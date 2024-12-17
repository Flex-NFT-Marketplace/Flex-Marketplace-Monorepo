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
    if (startTime > snapshotTime) {
      throw new HttpException(
        'The start time must be less than the snapshot time',
        HttpStatus.BAD_REQUEST,
      );
    }

    const creatorDocument = await this.userService.getOrCreateUser(user);

    const exitedEv = await this.flexHausEventModel.findOne({
      creator: creatorDocument,
      snapshotTime: { $gte: startTime },
    });

    if (exitedEv) {
      throw new HttpException(
        'The previous event must be ended before creating a new one',
        HttpStatus.BAD_REQUEST,
      );
    }

    const event = new this.flexHausEventModel({
      creator: creatorDocument,
      perks,
      startTime,
      snapshotTime,
    });

    await event.save();

    return new BaseResult(event);
  }
}
