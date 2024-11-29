import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  NftCollectionResponseDto,
  NftSearchResponseDto,
  SearchQueryDto,
} from './dto/searchResponse';
import { SearchService } from './search.service';
import { BaseResult } from '@app/shared/types';
import { UserResponseDto } from '../user/dto/getUser.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('Search ')
@Controller('search')
@ApiExtraModels(NftSearchResponseDto, NftCollectionResponseDto)
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'API To Search follow Name or Description of nfts or collections , name account',
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
                    users: {
                      type: 'array',
                      $ref: getSchemaPath(UserResponseDto),
                    },
                    nfts: {
                      type: 'array',

                      $ref: getSchemaPath(NftSearchResponseDto),
                    },
                    nftCollections: {
                      type: 'array',

                      $ref: getSchemaPath(NftCollectionResponseDto),
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
  async search(@Body() query: SearchQueryDto) {
    try {
      if (!query.search) {
        console.log('Uodate', query.search);
        const key = `get-search - ${JSON.stringify({ ...query })}`;
        let data = await this.cacheManager.get(key);
        if (!data) {
          data = await this.searchService.search(query);
          await this.cacheManager.set(key, data, 300000);
          return new BaseResult(data);
        }
        return new BaseResult(data);
      }
      const data = await this.searchService.search(query);
      return new BaseResult(data);
    } catch (error) {
      throw new BadRequestException('Something Went  Wrong from Search');
    }
  }
}
