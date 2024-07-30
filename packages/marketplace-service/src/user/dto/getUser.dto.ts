import { IsHexadecimal, IsOptional, IsString } from 'class-validator';

export class GetUserInfoDto {
  @IsHexadecimal()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  username?: string;
}
