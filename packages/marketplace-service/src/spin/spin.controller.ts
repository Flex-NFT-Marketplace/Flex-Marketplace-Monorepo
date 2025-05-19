import { Body, Controller, Get, Post } from '@nestjs/common';
import { SpinService } from './spin.service';
import { ApiTags } from '@nestjs/swagger';
import { BaseQueryParams, BaseResult } from '@app/shared/types';
import { JWT, User, iInfoToken } from '@app/shared/modules';

@Controller('spin')
@ApiTags('spin')
export class SpinController {
  constructor(private readonly spinService: SpinService) {}

  @Get('rewards')
  async getSpinRewards() {
    const result = await this.spinService.getSpinRewards();
    return new BaseResult(result);
  }

  @Post('claim-ticket')
  @JWT()
  async claimTicket(@User() user: iInfoToken) {
    const result = await this.spinService.claimTicket(user.sub);
    return new BaseResult(result);
  }

  @Get('tickets')
  @JWT()
  async getTickets(@User() user: iInfoToken) {
    const result = await this.spinService.getTickets(user.sub);
    return new BaseResult(result);
  }

  @Post('tickets-can-claim')
  @JWT()
  async ticketsCanClaim(@User() user: iInfoToken) {
    const result = await this.spinService.ticketsCanClaim(user.sub);
    return new BaseResult(result);
  }

  @Post('settle')
  @JWT()
  async settle(@User() user: iInfoToken) {
    const result = await this.spinService.settle(user.sub);
    return new BaseResult(result);
  }

  @Post('history')
  async history(@Body() query: BaseQueryParams) {
    const result = await this.spinService.getHistory(query);
    return result;
  }
}
