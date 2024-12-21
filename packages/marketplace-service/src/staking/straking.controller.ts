import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { StakingQueryDto } from './dto/stakingQuery.dto';
import { StakingService } from './staking.service';

@ApiTags('Staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}
  @Get('/info')
  async getStakingInfo(@Query() query: StakingQueryDto) {
    try {
      const data = await this.stakingService.getStakingInfo(query);
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
