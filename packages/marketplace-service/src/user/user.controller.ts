import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { JWT, User } from '@app/shared/modules';
import { BaseResult } from '@app/shared/types/base.result';
import { UserDto } from '@app/shared/models';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { GetUserInfoDto } from './dto/getUser.dto';
import { UpdateUserInfo } from './dto/updateUser.dto';

@ApiTags('Users')
@Controller('user')
@ApiExtraModels(UserDto)
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
                  $ref: getSchemaPath(UserDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getUserInfo(
    @Query() query: GetUserInfoDto,
  ): Promise<BaseResult<UserDto>> {
    const data = await this.userService.getUserInfo(query);

    return new BaseResult<UserDto>(data);
  }

  @JWT()
  @Post('update-profile')
  @ApiOperation({
    summary: 'Update user info',
  })
  async updateProfile(@Body() body: UpdateUserInfo, @User() user: iInfoToken) {
    return await this.userService.updateUserInformation(user.sub, body);
  }
}
