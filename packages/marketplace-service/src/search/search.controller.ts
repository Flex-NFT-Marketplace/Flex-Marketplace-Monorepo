import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
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

@ApiTags('Search ')
@Controller('search')
@ApiExtraModels(NftSearchResponseDto, NftCollectionResponseDto)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

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
      const data = await this.searchService.search(query);
      return new BaseResult(data);
    } catch (error) {
      console.log('What Wrong', error);
      throw new BadRequestException('Something Went  Wrong from Search');
    }
  }
}
