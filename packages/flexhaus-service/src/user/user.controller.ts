import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FlexHausSubscription } from '@app/shared/models';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types/base.result';
import { SubscribeDTO } from './dto/subscribe.dto';
import {
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
  ApiTags,
  ApiExtraModels,
} from '@nestjs/swagger';
import { isHexadecimal } from 'class-validator';
import { BaseResultPagination } from '@app/shared/types';
import { QuerySubscriberDto } from './dto/querySubscriber.dto';

@ApiTags('User')
@Controller('user')
@ApiExtraModels(
  BaseResult,
  FlexHausSubscription,
  SubscribeDTO,
  BaseResultPagination,
)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @JWT()
  @Put('subscribe')
  @ApiOperation({
    summary: 'Subscribe a user',
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
                  $ref: getSchemaPath(FlexHausSubscription),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async subscribe(@Body() body: SubscribeDTO, @User() user: iInfoToken) {
    const subscription = await this.userService.subscribe(user.sub, body);
    return new BaseResult(subscription);
  }

  @JWT()
  @Delete('unsubscribe')
  @ApiOperation({
    summary: 'Unsubscribe a user',
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
                  $ref: getSchemaPath(FlexHausSubscription),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async unSubscribe(@Body() body: SubscribeDTO, @User() user: iInfoToken) {
    const subscription = await this.userService.unSubscribe(user.sub, body);
    return new BaseResult(subscription);
  }

  @JWT()
  @Get('/:creator/check-subscribed')
  @ApiOperation({
    summary: 'Check if the creator is subscribed by the user',
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
    description: 'Check if the creator is subscribed by the user',
  })
  async checkSubscribed(
    @Param('creator') creator: string,
    @User() user: iInfoToken,
  ): Promise<BaseResult<boolean>> {
    if (!isHexadecimal(creator)) {
      throw new HttpException(
        'Invalid creator address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isSubscribed = await this.userService.checkSubscribed(
      user.sub,
      creator,
    );

    return new BaseResult(isSubscribed);
  }

  @Get('/:creator/total-subscription')
  @ApiOperation({
    summary: 'Get the total subscription by the creator',
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
  async getTotalSubscription(
    @Param('creator') creator: string,
  ): Promise<BaseResult<number>> {
    if (!isHexadecimal(creator)) {
      throw new HttpException(
        'Invalid creator address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const totalSubscription =
      await this.userService.getTotalSubscription(creator);

    return new BaseResult(totalSubscription);
  }

  @Post('/subscribers')
  @ApiOperation({
    summary: 'Get subscribers by creator',
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
                        $ref: getSchemaPath(FlexHausSubscription),
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
  async getSubscribers(
    @Body() query: QuerySubscriberDto,
  ): Promise<BaseResultPagination<FlexHausSubscription>> {
    return await this.userService.getSubscribers(query);
  }
}
