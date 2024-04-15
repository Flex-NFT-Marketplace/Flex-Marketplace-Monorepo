import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
@ApiTags('Authentication')
@Controller('authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('/getNonce')
  async getSignMessage(@Query('address') address: string) {
    const randomNonce = Math.floor(Math.random() * 1000000);
    return this.authService.getSignMessage(address, randomNonce);
  }
  @Post('/connectWallet')
  async connectWallet() {
    return 'Connect Wallet';
  }
}
