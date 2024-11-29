import { IsHexadecimal, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';
export class GetSignatureActivityQueryDTO extends BaseQueryParams {
  @ApiProperty({
    required: false,
    description: 'Contract address of NFT',
  })
  @IsOptional()
  @IsHexadecimal()
  contract_address?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  sortPrice?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  minPrice?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  search?: string;
}
