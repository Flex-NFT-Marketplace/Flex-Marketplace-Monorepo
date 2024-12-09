import { IsEnum, IsHexadecimal, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseQueryParams } from '@app/shared/types';
import { SignStatusEnum } from '@app/shared/models';
export class GetSignatureActivityQueryDTO extends BaseQueryParams {
  @ApiProperty({
    required: false,
    description: 'nft contract address',
  })
  @IsOptional()
  @IsHexadecimal()
  contract_address?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  token_id?: string;

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
  @IsEnum(SignStatusEnum)
  @IsOptional()
  status?: SignStatusEnum;

  // @ApiProperty({
  //   required: false,
  // })
  // @IsOptional()
  // search?: string;
}
