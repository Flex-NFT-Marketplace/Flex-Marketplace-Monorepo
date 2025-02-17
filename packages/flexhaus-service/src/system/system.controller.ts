import {
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
  ApiTags,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Controller, Get, Post } from '@nestjs/common';
import { BaseResult } from '@app/shared/types';
import { PointPriceDto } from './dto/pointPrice.dto';
import { SystemService } from './system.service';

@Controller('system')
@ApiTags('system')
@ApiExtraModels(BaseResult, PointPriceDto)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check if the server is healthy' })
  @ApiOkResponse({ description: 'Server is healthy' })
  async healthCheck() {
    return { status: 'ok' };
  }

  @Post('get-point-price')
  @ApiOperation({ summary: 'Get the price of a point' })
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
                  $ref: getSchemaPath(PointPriceDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getPointPrice() {
    const pointPrice = await this.systemService.getPointPrice();
    return new BaseResult(pointPrice);
  }
}
