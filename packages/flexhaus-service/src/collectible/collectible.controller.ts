import {
  FlexHausDrop,
  FlexHausLike,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleDocument,
  NftCollections,
} from '@app/shared/models';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { Controller, Delete, Post, Body, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import { GetCollectiblesDto } from './dto/queryCollectibles.dto';
import { CollectibleService } from './collectible.service';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { CollectibleDto } from './dto/collectible.dto';
import { GetSecuredCollectiblesDto } from './dto/querySecuredCollectibles.dto';
import { GetDistributedCollectiblesDto } from './dto/queryDistributedCollectibles.dto';
import { ClaimCollectibleDto } from './dto/claimCollectible.dto';

@ApiTags('FlexHausCollectible')
@Controller('collectible')
@ApiExtraModels(
  BaseResult,
  FlexHausDrop,
  NftCollections,
  BaseResultPagination,
  FlexHausLike,
  FlexHausSecureCollectible,
)
export class CollectibleController {
  constructor(private readonly collectibleService: CollectibleService) {}

  @Post('get-collectible-dropes')
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
                        $ref: getSchemaPath(FlexHausDrop),
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

  @JWT()
  @Post('like-collectible')
  @ApiOperation({
    summary: 'Like Collectible',
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
                  $ref: getSchemaPath(FlexHausLike),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async likeCollectible(
    @Body() query: CollectibleDto,
    @User() user: iInfoToken,
  ) {
    const response = await this.collectibleService.likeCollectible(
      query,
      user.sub,
    );

    return new BaseResult(response);
  }

  @JWT()
  @Delete('unlike-collectible')
  @ApiOperation({
    summary: 'Unlike Collectible',
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
                  $ref: getSchemaPath(FlexHausLike),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async unlikeCollectible(
    @Body() query: CollectibleDto,
    @User() user: iInfoToken,
  ) {
    const response = await this.collectibleService.unlikeCollectible(
      query,
      user.sub,
    );

    return new BaseResult(response);
  }

  @JWT()
  @Get('is-liked')
  @ApiOperation({
    summary: 'Check if user has liked collectible',
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
  async isLiked(
    @Query() query: CollectibleDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<boolean>> {
    const response = await this.collectibleService.isLiked(query, user.sub);

    return new BaseResult(response);
  }

  @JWT()
  @Get('is-secured')
  @ApiOperation({
    summary: 'Check if collectible is secured',
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
  async isSecured(
    @Query() query: CollectibleDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<boolean>> {
    const response = await this.collectibleService.isSecured(query, user.sub);

    return new BaseResult(response);
  }

  @Get('get-total-likes')
  @ApiOperation({
    summary: 'Get Total Likes of Collectible',
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
  async getTotalLikes(
    @Query() query: CollectibleDto,
  ): Promise<BaseResult<number>> {
    const response = await this.collectibleService.getTotalLikes(query);

    return new BaseResult(response);
  }

  @JWT()
  @Post('secure-collectible')
  @ApiOperation({
    summary: 'Create a secure collectible',
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
  async secureCollectible(
    @Body() param: CollectibleDto,
    @User() user: iInfoToken,
  ) {
    const result = await this.collectibleService.secureCollectible(
      param,
      user.sub,
    );
    return new BaseResult(result);
  }

  @JWT()
  @Post('get-secured-collectibles')
  @ApiOperation({
    summary: 'Get secured collectibles',
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
                        $ref: getSchemaPath(FlexHausSecureCollectible),
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
  async getSecuredCollectibles(
    @Body() query: GetSecuredCollectiblesDto,
    @User() user: iInfoToken,
  ): Promise<BaseResultPagination<FlexHausSecureCollectibleDocument>> {
    return await this.collectibleService.getSecuredCollectibles(
      query,
      user.sub,
    );
  }

  @JWT()
  @Get('get-distribution-collectibles')
  @ApiOperation({
    summary: 'Get distribution collectibles',
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
                        $ref: getSchemaPath(FlexHausSecureCollectible),
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
  async getDistributionCollectibles(
    @Body() query: GetDistributedCollectiblesDto,
    @User() user: iInfoToken,
  ): Promise<BaseResultPagination<FlexHausSecureCollectibleDocument>> {
    return await this.collectibleService.getDistributionCollectibles(
      query,
      user.sub,
    );
  }

  @JWT()
  @Post('claim-collectible')
  @ApiOperation({
    summary: 'Claim a collectible',
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
                  $ref: getSchemaPath(ClaimCollectibleDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async claimCollectible(
    @Body() query: CollectibleDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<ClaimCollectibleDto>> {
    const result = await this.collectibleService.claimCollectible(
      query,
      user.sub,
    );
    return new BaseResult(result);
  }
}
