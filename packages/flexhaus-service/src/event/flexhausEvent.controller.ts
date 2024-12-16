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
  BadRequestException,
} from '@nestjs/common';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types/base.result';
import { FlexHausEvents } from '@app/shared/models';
import { FlexHausEventService } from './flexhausEvent.service';
import { CreateEventDto } from './dto/createEvent.dto';

@ApiTags('FlexHausEvent')
@Controller('flexhaus-event')
@ApiExtraModels(FlexHausEvents)
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
}
