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
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
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
