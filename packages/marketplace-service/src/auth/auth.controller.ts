import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  GetNonceDto,
  GetNonceRspDto,
  GetTokenDto,
  GetTokenRspDto,
} from '@app/shared/modules/jwt/auth.dto';
import { BaseResult } from '@app/shared/types/base.result';
import { UserService } from '../user/user.service';
@ApiTags('Authentication')
@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/getNonce')
  async getSignMessage(
    @Query() query: GetNonceDto,
  ): Promise<BaseResult<GetNonceRspDto>> {
    const address = query.address;
    const user = await this.userService.getOrCreateUser(address);
    const message = await this.authService.getSignMessage(address, user.nonce);
    return {
      success: true,
      data: {
        nonce: user.nonce,
        signMessage: message,
      },
    };
  }

  @Post('/token')
  async connectWallet(
    @Body() tokenDto: GetTokenDto,
  ): Promise<BaseResult<GetTokenRspDto>> {
    const data = await this.authService.login(tokenDto);
    return {
      success: true,
      data: data,
    };
  }
  @Post('/test-sign')
  async testSign() {
    const data = await this.authService.testSignMessage();
    return { data };
  }
}
