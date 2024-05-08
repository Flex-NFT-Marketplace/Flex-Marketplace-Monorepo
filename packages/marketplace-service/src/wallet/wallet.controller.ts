import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JWT } from '@app/shared/modules';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @JWT()
  @Post('/create')
  async createWallet() {}
}
