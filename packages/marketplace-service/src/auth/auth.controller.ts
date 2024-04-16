import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetNonceRspDto } from '@app/shared/modules/jwt/auth.dto';
import { BaseResult } from '@app/shared/types/base.result';
@ApiTags('Authentication')
@Controller('authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/getNonce')
  async getSignMessage(
    @Query('address') address: string,
  ): Promise<BaseResult<GetNonceRspDto>> {
    const message = await this.authService.getSignMessage(address);
    return {
      success: true,
      data: {
        signMessage: message,
      },
    };
  }

  @Post('/connectWallet')
  async connectWallet() {
    return 'Connect Wallet';
  }
}
