import { Controller, Get, Body, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuestService } from './quest.service';
import { BaseResult } from '@app/shared/types';
import { JWT, User, iInfoToken } from '@app/shared/modules';
import { VerifyQuestProcessDto } from './dto/verifyQuest.dto';
import { QuestProcessDocument } from '@app/shared/models';

@Controller('quests')
@ApiTags('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get()
  async getQuests() {
    const quests = await this.questService.getQuests();
    return new BaseResult(quests);
  }

  @JWT()
  @Get('processing')
  async getQuestsProcessing(@User() token: iInfoToken) {
    const quests = await this.questService.getQuestsProcessing(token.sub);
    return new BaseResult(quests);
  }

  @JWT()
  @Post('verify-process')
  async verifyProcess(
    @Body() body: VerifyQuestProcessDto,
    @User() token: iInfoToken,
  ): Promise<BaseResult<QuestProcessDocument>> {
    const verify = await this.questService.verifyQuestProcess(body, token.sub);

    return new BaseResult(verify);
  }

  @JWT()
  @Post('claim-reward')
  async claimReward(
    @Body() body: VerifyQuestProcessDto,
    @User() token: iInfoToken,
  ) {
    const claim = await this.questService.claimReward(body, token.sub);
    return new BaseResult(claim);
  }
}
