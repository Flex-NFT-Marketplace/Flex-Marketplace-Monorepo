import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FlexHausDonateDocument,
  FlexHausDonates,
  FlexHausEvents,
} from '@app/shared/models';
import { BaseResult } from '@app/shared/types/base.result';
import { formattedContractAddress } from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { CreateEventDto } from './dto/createEvent.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { QueryEventsDto } from './dto/queryEvents.dto';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { DonateDto } from './dto/donate.dto';
import { QueryLeaderboardDto } from './dto/queryLeaderboard.dto';

@Injectable()
export class FlexHausEventService {
  constructor(
    @InjectModel(FlexHausEvents.name)
    private readonly flexHausEventModel: Model<FlexHausEvents>,
    @InjectModel(FlexHausDonates.name)
    private readonly flexHausDonateModel: Model<FlexHausDonateDocument>,
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
      .find(filter, {}, { sort: sort, skip: skipIndex, limit: size })
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

    if (event.startTime < Date.now()) {
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

  async donate(query: DonateDto, user: string): Promise<boolean> {
    const { creator, amount } = query;
    const creatorDocument = await this.userService.getOrCreateUser(creator);
    const now = Date.now();

    const event = await this.flexHausEventModel.findOne(
      {
        creator: creatorDocument,
        snapshotTime: { $gt: now },
        startTime: { $lte: now },
        isCancelled: false,
      },
      {},
      { sort: { startTime: 1 } },
    );

    if (!event) {
      throw new HttpException('There is no event yet!', HttpStatus.BAD_REQUEST);
    }

    const userDocument = await this.userService.getOrCreateUser(user);
    if (!userDocument.points || userDocument.points < amount) {
      throw new HttpException('Insufficient points', HttpStatus.BAD_REQUEST);
    }

    await this.userService.updatePoints(
      creator,
      Number(creatorDocument.points || 0) + amount,
    );
    await this.userService.updatePoints(
      user,
      Number(userDocument.points) - amount,
    );

    const newFlexHausDonate = new this.flexHausDonateModel({
      user: userDocument,
      creator: creatorDocument,
      event,
      amount,
      donatedAt: now,
    });
    await newFlexHausDonate.save();

    return true;
  }

  async getUserRanking(eventId: string, user: string) {
    const userDocument = await this.userService.getOrCreateUser(user);

    const event = await this.flexHausEventModel.findOne({
      _id: eventId,
    });

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    const ranking = await this.flexHausDonateModel.aggregate([
      {
        $match: {
          event: event._id,
        },
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: '$amount' },
          event: { $first: '$event' },
          creator: { $first: '$creator' },
        },
      },
      {
        $sort: { amount: -1 },
      },
      {
        $setWindowFields: {
          sortBy: { amount: -1 },
          output: {
            rank: { $rank: {} },
          },
        },
      },
      {
        $match: {
          _id: userDocument._id,
        },
      },
    ]);

    return ranking.length > 0 ? ranking[0].rank : 0;
  }

  async getLeaderboard(
    query: QueryLeaderboardDto,
  ): Promise<BaseResultPagination<FlexHausDonates>> {
    const { eventId, page, size, skipIndex } = query;
    const result = new BaseResultPagination<FlexHausDonates>();

    const event = await this.flexHausEventModel.findOne({ _id: eventId });
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    const filter: any = {};
    filter.event = event._id;

    const total = await this.flexHausDonateModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$user',
        },
      },
      {
        $project: {
          _id: 0,
          total: { $sum: 1 },
        },
      },
    ]);

    if (total.length === 0 || total[0].total === 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.flexHausDonateModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: '$amount' },
          event: { $first: '$event' },
          creator: { $first: '$creator' },
        },
      },
      {
        $sort: { amount: -1 },
      },
      {
        $setWindowFields: {
          sortBy: { amount: -1 },
          output: {
            rank: { $rank: {} },
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: size,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                address: 1,
                username: 1,
                email: 1,
                avatar: 1,
                cover: 1,
                about: 1,
                socials: 1,
                isVerified: 1,
              },
            },
          ],
          as: '_id',
        },
      },
      {
        $unwind: { path: '$_id', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          user: '$_id',
          amount: 1,
          event: 1,
          creator: 1,
          rank: 1,
        },
      },
    ]);

    result.data = new PaginationDto(items, total[0].total, page, size);
    return result;
  }

  async getTotalPoints(eventId: string) {
    const event = await this.flexHausEventModel.findOne({
      _id: eventId,
    });

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    const total = await this.flexHausDonateModel.aggregate([
      {
        $match: {
          event: event._id,
        },
      },
      {
        $group: {
          _id: 0,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return total.length > 0 ? total[0].total : 0;
  }
}
