import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JWT, User } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types/base.result';
import { Socials } from '@app/shared/models';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { GetUserInfoDto, UserResponseDto } from './dto/getUser.dto';
import { UpdateUserInfo } from './dto/updateUser.dto';
import { QueryUserActivity } from './dto/userActivity.dto';
import { BaseResultPagination } from '@app/shared/types';
import { SignatureDTO } from '../signature/dto/signature.dto';

@ApiTags('Users')
@Controller('user')
@ApiExtraModels(UserResponseDto, Socials)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('/info')
  @ApiOperation({
    summary: 'Get user info',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(UserResponseDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getUserInfo(@Query() query: GetUserInfoDto) {
    try {
      const data = await this.userService.getUserInfo(query);
      return new BaseResult(data);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @JWT()
  @Post('update-profile')
  @ApiOperation({
    summary: 'Update user info',
  })
  async updateProfile(@Body() body: UpdateUserInfo, @User() user: iInfoToken) {
    return await this.userService.updateUserInformation(user.sub, body);
  }

  @Get('activity/:userAddress')
  @ApiOperation({
    summary: 'API Get User Activity Information by User Address and Status',
  })
  async getUserActivity(
    @Query() query: QueryUserActivity,
  ): Promise<BaseResultPagination<SignatureDTO>> {
    try {
      const data = await this.userService.getUserActivity(query);
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
