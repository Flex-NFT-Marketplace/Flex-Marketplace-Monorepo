import { Socials } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl, IsOptional } from 'class-validator';

export class UpdateUserInfo {
  @ApiProperty()
  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  @ApiProperty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ApiProperty()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @ApiProperty()
  @IsUrl()
  cover?: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  about?: string;

  @IsOptional()
  @ApiProperty()
  social?: Socials;
}
