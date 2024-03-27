import { Socials } from '../schemas';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsHexadecimal,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UserDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  username: string;

  @IsEmail()
  email?: string;

  @IsUrl()
  avatar?: string;

  @IsUrl()
  cover?: string;

  @IsString()
  about?: string;

  @IsBoolean()
  emailVerified?: boolean;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => String(value).toLowerCase().trim())
  address: string;

  @IsNumber()
  nonce: number;

  @IsObject()
  socials?: Socials;

  @IsBoolean()
  isVerified?: boolean;

  @IsArray()
  roles: string[];
}
