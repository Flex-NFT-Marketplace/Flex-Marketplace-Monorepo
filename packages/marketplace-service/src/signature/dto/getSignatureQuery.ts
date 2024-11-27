import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';
export class GetSignatureActivityQueryDTO extends BaseQueryParams {
  @ApiProperty()
  contract_address?: string;

  @ApiProperty()
  sortPrice?: string;

  @ApiProperty()
  minPrice?: number;

  @ApiProperty()
  maxPrice?: number;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  search?: string;
}
