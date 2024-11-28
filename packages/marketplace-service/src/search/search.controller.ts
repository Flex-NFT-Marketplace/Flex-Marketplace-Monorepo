import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchQueryDto } from './dto/searchResponse';
import { SearchService } from './search.service';
import { BaseResult } from '@app/shared/types';

@ApiTags('Search ')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('/search')
  @ApiOperation({
    summary:
      'API To Search follow Name or Description of nfts or collections , name account',
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
