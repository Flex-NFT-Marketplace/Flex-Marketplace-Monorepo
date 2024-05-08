import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class BaseResultPagination<T> {
  @ApiProperty()
  errors?: Record<string, string[]>;
  @ApiProperty()
  data?: PaginationDto<T>;
  @ApiProperty()
  success? = true;
}
