import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types/base.result';
import { FlexHausDonates, FlexHausEvents } from '@app/shared/models';
import { FlexHausEventService } from './flexhausEvent.service';
import { CreateEventDto } from './dto/createEvent.dto';
import { isHexadecimal, isMongoId } from 'class-validator';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { BaseResultPagination } from '@app/shared/types';
import { QueryEventsDto } from './dto/queryEvents.dto';
import { DonateDto } from './dto/donate.dto';
import { QueryLeaderboardDto } from './dto/queryLeaderboard.dto';

@ApiTags('FlexHausEvent')
@Controller('flexhaus-event')
@ApiExtraModels(FlexHausEvents, FlexHausDonates)
export class FlexHausEventController {
  constructor(private readonly flexHausEventService: FlexHausEventService) {}

  @JWT()
  @Post('create-new-event')
  @ApiOperation({
    summary: 'Create a new event',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(FlexHausEvents),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async createEvent(
    @Body() body: CreateEventDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausEvents>> {
    return await this.flexHausEventService.createNewEvent(user.sub, body);
  }

  @JWT()
  @Post('update-event')
  @ApiOperation({
    summary: 'Update an event',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(FlexHausEvents),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async updateEvent(
    @Body() body: UpdateEventDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausEvents>> {
    return await this.flexHausEventService.updateEvent(user.sub, body);
  }

  @Get('get-current-event')
  @ApiOperation({
    summary: 'Get the current event by creator',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(FlexHausEvents),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getCurrentEvent(
    @Query('creator') creator: string,
  ): Promise<BaseResult<FlexHausEvents>> {
    if (!isHexadecimal(creator)) {
      throw new HttpException(
        'Invalid creator address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const event = await this.flexHausEventService.getCurrentEvent(creator);

    return new BaseResult(event);
  }

  @Post('get-events')
  @ApiOperation({
    summary: 'Get events by query',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(FlexHausEvents),
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getEvents(
    @Body() query: QueryEventsDto,
  ): Promise<BaseResultPagination<FlexHausEvents>> {
    return await this.flexHausEventService.getEvents(query);
  }

  @JWT()
  @Delete('delete-event')
  @ApiOperation({
    summary: 'Delete an event',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(FlexHausEvents),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async deleteEvent(
    @Query('eventId') eventId: string,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausEvents>> {
    if (!isHexadecimal(eventId)) {
      throw new HttpException(
        'Invalid eventId address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const event = await this.flexHausEventService.deleteEvent(
      user.sub,
      eventId,
    );

    return new BaseResult(event);
  }

  @JWT()
  @Post('donate')
  @ApiOperation({
    summary: 'Donate to creator',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(Boolean),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async donate(
    @Body() donateDto: DonateDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<boolean>> {
    const result = await this.flexHausEventService.donate(donateDto, user.sub);
    return new BaseResult(result);
  }

  // @JWT()
  @Get('get-user-ranking')
  @ApiOperation({
    summary: 'Get user ranking',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(Number),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getUserRanking(
    @Query('eventId') eventId: string,
    // @User() user: iInfoToken,
  ): Promise<BaseResult<Number>> {
    if (!isMongoId(eventId)) {
      throw new HttpException('Invalid eventId', HttpStatus.BAD_REQUEST);
    }

    const result = await this.flexHausEventService.getUserRanking(
      eventId,
      '0x00ed159a749f4de53f63da3ee86e8fc307e4b0d177e4ffafa837a6c9b5eaf3b0',
    );
    return new BaseResult(result);
  }

  @Post('leaderboard')
  @ApiOperation({
    summary: 'Get leaderboard',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(FlexHausDonates),
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getLeaderboard(
    @Body() query: QueryLeaderboardDto,
  ): Promise<BaseResultPagination<FlexHausDonates>> {
    return await this.flexHausEventService.getLeaderboard(query);
  }

  @Get('get-total-points')
  @ApiOperation({
    summary: 'Get total points by event',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(Number),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getTotalPoints(
    @Query('eventId') eventId: string,
  ): Promise<BaseResult<Number>> {
    if (!isMongoId(eventId)) {
      throw new HttpException('Invalid eventId', HttpStatus.BAD_REQUEST);
    }

    const result = await this.flexHausEventService.getTotalPoints(eventId);
    return new BaseResult(result);
  }
}
