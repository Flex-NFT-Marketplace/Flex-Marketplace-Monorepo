import { HistoryDto } from '@app/shared/models';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import {
  Controller,
  Post,
  HttpCode,
  Body,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { QueryHistoriesDto } from './dtos/queryHistory.dto';
import { HistoryService } from './history.service';

@ApiTags('Histories')
@ApiExtraModels(BaseResultPagination, PaginationDto, HistoryDto)
@Controller('histories')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @ApiOperation({
    summary: 'Get Histories By Query params',
    description: 'Use this API to get the history of NFTs.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: {
                    $ref: getSchemaPath(HistoryDto),
                  },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getHistories(@Body() params: QueryHistoriesDto) {
    try {
      return await this.historyService.getHistories(params);
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }
}
