import { Socials } from '@app/shared/models';
import { IsHexadecimal, IsOptional } from 'class-validator';

export class GetUserInfoDto {
  @IsHexadecimal()
  @IsOptional()
  address?: string;
}

export class UserResponseDto {
  username: string;
  email?: string;
  avatar?: string;
  cover?: string;
  about?: string;
  emailVerified?: boolean;
  address: string;
  socials?: Socials;
  isVerified?: boolean;
}
