import { NftCollections } from '@app/shared/models';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import { GetCollectiblesDto } from './dto/queryCollectibles.dto';
import { CollectibleService } from './collectible.service';

@Controller('collectible')
export class CollectibleController {
  constructor(private readonly collectibleService: CollectibleService) {}

  @Post('get-collectibles')
  @ApiOperation({
    summary: 'Get Collectibles',
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
                        $ref: getSchemaPath(NftCollections),
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
  async getCollectibles(@Body() query: GetCollectiblesDto) {
    return await this.collectibleService.getCollectibles(query);
  }
}
