import { Socials, Users } from '@app/shared/models';
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

  static from(user: Users): UserResponseDto {
    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      cover: user.cover,
      about: user.about,
      emailVerified: user.emailVerified,
      address: user.address,
      socials: user.socials,
      isVerified: user.isVerified,
    };
  }
}
