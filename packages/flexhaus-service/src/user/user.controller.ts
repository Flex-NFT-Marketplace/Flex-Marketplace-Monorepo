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
import { FlexHausSubscription, UserDocument, Users } from '@app/shared/models';
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
import { BaseQueryParams, BaseResultPagination } from '@app/shared/types';
import { QuerySubscriberDto } from './dto/querySubscriber.dto';
import { PaymentAddressDTO } from './dto/paymentAddress.dto';

@ApiTags('User')
@Controller('user')
@ApiExtraModels(
  BaseResult,
  FlexHausSubscription,
  SubscribeDTO,
  BaseResultPagination,
  PaymentAddressDTO,
  Number,
  Boolean,
  BaseQueryParams,
  Users,
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

  @Get('/:user/total-all-time-support')
  @ApiOperation({
    summary: 'Get the total all time support by the user',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          type: 'object',
          properties: {
            data: {
              type: 'number',
            },
          },
        },
      ],
    },
  })
  async getTotalAllTimeSupport(
    @Param('user') user: string,
  ): Promise<BaseResult<Number>> {
    if (!isHexadecimal(user)) {
      throw new HttpException('Invalid user address', HttpStatus.BAD_REQUEST);
    }

    const totalAllTimeSupport =
      await this.userService.getTotalAllTimeSupport(user);

    return new BaseResult(totalAllTimeSupport);
  }

  @Get('/:user/total-subscribing')
  @ApiOperation({
    summary: 'Get the total subscribing by the user',
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
  async getTotalSubscribing(
    @Param('user') user: string,
  ): Promise<BaseResult<number>> {
    if (!isHexadecimal(user)) {
      throw new HttpException('Invalid user address', HttpStatus.BAD_REQUEST);
    }

    const totalSubscribing = await this.userService.getTotalSubscribing(user);

    return new BaseResult(totalSubscribing);
  }

  @Post('get-highlights-creators')
  @ApiOperation({
    summary: 'Get creators with highlights',
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
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(Users),
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
  async getHighlightsCreators(): Promise<BaseResult<UserDocument[]>> {
    const creators = await this.userService.getHighlightsCreators();
    return new BaseResult(creators);
  }

  @Post('get-random-creators')
  @ApiOperation({
    summary: 'Get random creators',
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
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(Users),
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
  async getRandomCreators(): Promise<BaseResult<UserDocument[]>> {
    const creators = await this.userService.getRandomCreators();
    return new BaseResult(creators);
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

  @JWT()
  @Post('/get-payment-wallet')
  @ApiOperation({
    summary: 'Get Payment Wallet By User Address',
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
                  $ref: getSchemaPath(PaymentAddressDTO),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getOrGenerateWallet(@User() user: iInfoToken) {
    const data = await this.userService.getOrGeneratePaymentWallet(user.sub);
    return new BaseResult(data);
  }
}
