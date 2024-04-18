import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';

import { JWT } from '@app/shared/modules';

@ApiTags('Users')
@Controller('users')
@JWT()
export class UsersController {
  constructor(private readonly userService: UserService) {}
  @Get('/info')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserInfo(@Req() req: Request) {
    console.log('Request Data', req);
    // const { sub }: JwtPayload = await this.authService.verifyToken(accessToken);
    // return await this.userService.getUser();
  }
}
