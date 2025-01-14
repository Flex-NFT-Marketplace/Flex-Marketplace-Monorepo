import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlexHausEvents } from '@app/shared/models';
import { BaseResult } from '@app/shared/types/base.result';
import { formattedContractAddress } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { CreateEventDto } from './dto/createEvent.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { QueryEventsDto } from './dto/queryEvents.dto';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';

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
      isCancelled: false,
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

  async getEvents(
    query: QueryEventsDto,
  ): Promise<BaseResultPagination<FlexHausEvents>> {
    const { page, size, sort, skipIndex } = query;
    const result = new BaseResultPagination<FlexHausEvents>();

    const filter: any = {};
    if (query.creator) {
      filter.creator = await this.userService.getOrCreateUser(query.creator);
    }

    if (query.isCancelled !== undefined) {
      filter.isCancelled = query.isCancelled;
    }

    const total = await this.flexHausEventModel.countDocuments(filter);
    if (total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausEventModel
      .find(filter, {}, { sort, skip: skipIndex, limit: size })
      .populate([
        {
          path: 'creator',
          select: [
            'address',
            'username',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
      ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async updateEvent(
    creator: string,
    body: UpdateEventDto,
  ): Promise<BaseResult<FlexHausEvents>> {
    const { eventId } = body;
    const creatorDocument = await this.userService.getOrCreateUser(creator);

    const event = await this.flexHausEventModel.findOne({
      creator: creatorDocument,
      _id: eventId,
      isCancelled: false,
    });

    if (!event) {
      throw new HttpException(
        'The event does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (event.startTime < Date.now()) {
      throw new HttpException(
        'The event has already started',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (body.snapshotTime == 0 || body.startTime == 0) {
      throw new HttpException(
        'Invalid snapshot time or start time',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      body.snapshotTime &&
      body.startTime &&
      body.snapshotTime <= body.startTime
    ) {
      throw new HttpException(
        'The snapshot time must be greater than the start time',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      body.snapshotTime &&
      !body.startTime &&
      event.startTime >= body.snapshotTime
    ) {
      throw new HttpException(
        'The snapshot time must be greater than the start time',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      body.startTime &&
      !body.snapshotTime &&
      event.snapshotTime <= body.startTime
    ) {
      throw new HttpException(
        'The start time must be less than the snapshot time',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedData: any = {};
    if (body.snapshotTime) {
      updatedData.snapshotTime = body.snapshotTime;
    }

    if (body.startTime) {
      updatedData.startTime = body.startTime;
    }

    if (body.perks) {
      updatedData.perks = body.perks;
    }

    return await this.flexHausEventModel.findOneAndUpdate(
      { _id: eventId },
      { $set: updatedData },
      { new: true },
    );
  }

  async getCurrentEvent(creator: string): Promise<FlexHausEvents> {
    const creatorDocument = await this.userService.getOrCreateUser(creator);

    const now = Date.now();
    const event = await this.flexHausEventModel.findOne(
      {
        creator: creatorDocument,
        snapshotTime: { $gt: now },
        isCancelled: false,
      },
      {},
      { sort: { startTime: 1 } },
    );

    return event;
  }

  async deleteEvent(creator: string, eventId: string): Promise<FlexHausEvents> {
    const creatorDocument = await this.userService.getOrCreateUser(creator);

    const event = await this.flexHausEventModel.findOne({
      creator: creatorDocument,
      _id: eventId,
      isCancelled: false,
    });

    if (!event) {
      throw new HttpException(
        'The event does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (event.startTime > Date.now()) {
      throw new HttpException(
        'The event has already started',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.flexHausEventModel.findOneAndUpdate(
      {
        _id: eventId,
      },
      { $set: { isCancelled: true } },
      { new: true },
    );
  }
}
