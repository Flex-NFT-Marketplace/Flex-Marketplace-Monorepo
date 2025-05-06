import {
  QuestProcess,
  QuestProcessDocument,
  SpinRewardDocument,
  SpinRewards,
  SpinTicket,
  SpinTicketDocument,
  UserDocument,
  Users,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { SpinRewardType } from '@app/shared/types/enum.type';

@Injectable()
export class SpinService {
  constructor(
    @InjectModel(SpinRewards.name)
    private readonly spinRewardsModel: Model<SpinRewardDocument>,
    @InjectModel(QuestProcess.name)
    private readonly questProcessModel: Model<QuestProcessDocument>,
    @InjectModel(SpinTicket.name)
    private readonly spinTicketModel: Model<SpinTicketDocument>,
    @InjectModel(Users.name)
    private userModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}

  async getSpinRewards() {
    const result = await this.spinRewardsModel.find({}, { percentage: 0 });
    return result;
  }

  async claimTicket(userAddress: string) {
    const user = await this.userService.getOrCreateUser(userAddress);

    const questProcess = await this.questProcessModel.find({
      user: user._id,
      isClaimed: true,
      isConverted: false,
    });

    if (questProcess.length < 5) {
      throw new HttpException(
        'You have not completed enough quests',
        HttpStatus.NOT_FOUND,
      );
    }

    const tickets = Math.floor(questProcess.length / 5);
    const updatedProcess: QuestProcessDocument[] = [];
    for (let i = 0; i < questProcess.length; i += 5) {
      const chunk = questProcess.slice(i, i + 5);
      if (chunk.length === 5) {
        updatedProcess.push(...chunk);
      }
    }

    const updateBatch: any = [];
    for (const process of updatedProcess) {
      updateBatch.push({
        updateOne: {
          filter: {
            _id: process._id,
          },
          update: { $set: { isConverted: true } },
        },
      });
    }

    await this.questProcessModel.bulkWrite(updateBatch);
    const ticketDocument = await this.spinTicketModel.findOneAndUpdate(
      {
        user: user._id,
      },
      { $inc: { amount: tickets } },
      { upsert: true, new: true },
    );

    return ticketDocument;
  }

  async getTickets(userAddress: string) {
    const user = await this.userService.getOrCreateUser(userAddress);

    const tickets = await this.spinTicketModel.find({
      user: user._id,
    });

    return tickets;
  }

  async settle(userAddress: string) {
    const user = await this.userService.getOrCreateUser(userAddress);

    const tickets = await this.spinTicketModel.findOne({
      user: user._id,
    });

    if (!tickets || tickets.amount === 0) {
      throw new HttpException('You have no tickets', HttpStatus.NOT_FOUND);
    }

    const rewards = await this.spinRewardsModel.find().sort({ percentage: -1 });
    const rand = Math.random() * 100;
    let cumulative = 0;
    tickets.amount -= 1;
    await tickets.save();
    for (const reward of rewards) {
      if (reward.percentage === 0) continue;
      cumulative += reward.percentage;
      if (rand < cumulative) {
        switch (reward.reward) {
          case SpinRewardType.POINT:
            await this.userModel.findOneAndUpdate(
              { _id: user._id },
              { $inc: { flexPoint: reward.amount } },
            );
            break;
          case SpinRewardType.TICKET:
            break;
          case SpinRewardType.ETH:
            break;
          case SpinRewardType.STRK:
            break;
          case SpinRewardType.FLEX_EVO:
            break;
        }
        return { reward: reward.reward, amount: reward.amount };
      }
    }

    return { reward: 'nothing', amount: 0 };
  }
}
