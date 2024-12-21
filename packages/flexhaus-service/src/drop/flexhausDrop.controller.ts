import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Body,
  Post,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { CreateSetDto } from './dto/createSet.dto';
import { FlexDropService } from './flexhausDrop.service';
import { FlexHausSet, FlexHausSetDocument } from '@app/shared/models';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { GetFlexHausSetDto } from './dto/getSet.dto';
import { isHexadecimal } from 'class-validator';
import { AddCollectible } from './dto/addCollectible';

@ApiTags('FlexHausDrop')
@Controller('flexhaus-drop')
@ApiExtraModels(
  BaseResult,
  CreateSetDto,
  FlexHausSet,
  BaseResultPagination,
  GetFlexHausSetDto,
)
export class FlexDropController {
  constructor(private readonly flexDropService: FlexDropService) {}

  @JWT()
  @Post('create-new-set')
  @ApiOperation({
    summary: 'Create a new set of Collectibles',
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
                  $ref: getSchemaPath(FlexHausSet),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async createSet(
    @Body() body: CreateSetDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    return await this.flexDropService.createNewSet(user.sub, body);
  }

  @JWT()
  @Post('add-collectible')
  @ApiOperation({
    summary: 'Add Collectible to a set',
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
                  $ref: getSchemaPath(FlexHausSet),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async addCollectible(
    @Body() body: AddCollectible,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    return await this.flexDropService.addCollectible(user.sub, body);
  }

  @JWT()
  @Post('remove-collectible')
  @ApiOperation({
    summary: 'Remove Collectible from a set',
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
                  $ref: getSchemaPath(FlexHausSet),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async removeCollectible(
    @Body() body: AddCollectible,
    @User() user: iInfoToken,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    return await this.flexDropService.removeCollectible(user.sub, body);
  }

  @Post('get-sets')
  @ApiOperation({
    summary: 'Get all sets of collectibles',
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
                        $ref: getSchemaPath(FlexHausSet),
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
  async getSets(
    @Body() query: GetFlexHausSetDto,
  ): Promise<BaseResultPagination<FlexHausSetDocument>> {
    return await this.flexDropService.getSets(query);
  }

  @Get('get-set-by-id/:id')
  async getSetById(
    @Param('id') id: string,
  ): Promise<BaseResult<FlexHausSetDocument>> {
    if (!isHexadecimal(id)) {
      throw new HttpException('Invalid id', HttpStatus.BAD_REQUEST);
    }

    return await this.flexDropService.getSetById(id);
  }
}
