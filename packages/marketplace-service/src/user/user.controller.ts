import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JWT, User } from '@app/shared/modules';

import { BaseResult } from '@app/shared/types/base.result';
import { UserDto } from '@app/shared/models';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';

@ApiTags('Users')
@Controller('user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @JWT()
  @Get('/info')
  async getUserInfo(
    @Req() req: Request,
    @User() user: iInfoToken,
  ): Promise<BaseResult<UserDto>> {
    const data = await this.userService.getUser(user.sub);

    return new BaseResult<UserDto>(data);
  }
}
