import {
  FlexHausDonateDocument,
  FlexHausDonates,
  FlexHausDrop,
  FlexHausDropDocument,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleDocument,
  QuestDocument,
  QuestProcess,
  QuestProcessDocument,
  Quests,
  SignStatusEnum,
  Signature,
  SignatureDocument,
  UserDocument,
  Users,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuestProcessDto } from './dto/questProcess.dto';
import { VerifyQuestProcessDto } from './dto/verifyQuest.dto';
import { QuestType } from '@app/shared/types/enum.type';
import { UserService } from '../user/user.service';

@Injectable()
export class QuestService {
  constructor(
    @InjectModel(Quests.name)
    private readonly questModel: Model<QuestDocument>,
    @InjectModel(QuestProcess.name)
    private readonly questProcessModel: Model<QuestProcessDocument>,
    @InjectModel(FlexHausSecureCollectible.name)
    private readonly flexHausSecureCollectibleModel: Model<FlexHausSecureCollectibleDocument>,
    @InjectModel(FlexHausDonates.name)
    private readonly flexHausDonatesModel: Model<FlexHausDonateDocument>,
    @InjectModel(FlexHausDrop.name)
    private readonly flexHausDropModel: Model<FlexHausDropDocument>,
    @InjectModel(Signature.name)
    private readonly signatureModel: Model<SignatureDocument>,
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}

  async getQuests() {
    const total = await this.questModel.countDocuments();
    const quests = await this.questModel.find();

    return { total, quests };
  }

  async getQuestsProcessing(user: any) {
    const result: QuestProcessDto[] = [];
    const quests = await this.questModel.find();

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const userDocument = await this.userService.getOrCreateUser(user);

    for (const quest of quests) {
      const questProcess = await this.questProcessModel.findOne({
        user: userDocument._id,
        quest: quest._id,
        processTime: { $gte: start.getTime(), $lt: end.getTime() },
      });

      result.push({
        quest,
        processOfTask: questProcess?.processOfTask | 0,
        isVerified: questProcess?.isVerified || false,
        isClaimed: questProcess?.isClaimed || false,
        processTime: questProcess?.processTime || 0,
      });
    }

    return {
      user: userDocument,
      quests: result,
    };
  }

  async verifyQuestProcess(
    body: VerifyQuestProcessDto,
    user: string,
  ): Promise<QuestProcessDocument> {
    const { questId } = body;

    const quest = await this.questModel.findById(questId);
    if (!quest) {
      throw new HttpException('Quest not found', HttpStatus.NOT_FOUND);
    }

    const now = Date.now();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const userDocument = await this.userService.getOrCreateUser(user);
    let questProcess: QuestProcessDocument =
      await this.questProcessModel.findOne({
        user: userDocument._id,
        quest: quest._id,
        processTime: { $gte: start.getTime(), $lt: end.getTime() },
      });

    if (questProcess && questProcess.isVerified) {
      return questProcess;
    }

    switch (quest.type) {
      case QuestType.LOG_IN:
        questProcess = await this.verifyLogIn(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.PROTECT_FLEXHAUS_DROP:
        questProcess = await this.verifyProtectFlexDrop(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.THANKS_CREATOR:
        questProcess = await this.verifyThanksCreator(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.CREATE_FLEXHAUS_DROP:
        questProcess = await this.verifyCreateFlexDrop(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.BID_NFT:
        questProcess = await this.verifyBidNFT(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.LIST_NFT:
        questProcess = await this.verifyListNFT(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
      case QuestType.BUY_NFT:
        questProcess = await this.verifyBuyNFT(
          questProcess,
          quest,
          userDocument,
          now,
        );
        break;
    }

    return questProcess;
  }

  async verifyLogIn(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    if (questProcess) {
      questProcess.processOfTask = 1;
      questProcess.isVerified = true;
      questProcess.processTime = time;
      await questProcess.save();

      return questProcess;
    }
    const newQuestProcess = new this.questProcessModel({
      user: userDocument._id,
      quest: quest._id,
      processOfTask: 1,
      isVerified: true,
      processTime: time,
    });

    return await newQuestProcess.save();
  }

  async verifyProtectFlexDrop(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const flexHausSecured =
      await this.flexHausSecureCollectibleModel.countDocuments({
        user: userDocument._id,
        isSecured: true,
        createdAt: { $gte: start.getTime(), $lt: end.getTime() },
      });

    let newQuestProcess: QuestProcessDocument = null;

    if (flexHausSecured >= quest.amountOfTask) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (flexHausSecured > 0) {
      if (questProcess) {
        questProcess.processOfTask = flexHausSecured;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: flexHausSecured,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }

    return questProcess;
  }

  async verifyThanksCreator(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const flexHausDonated = await this.flexHausDonatesModel.aggregate([
      {
        $match: {
          user: userDocument._id,
          donatedAt: { $gte: start.getTime(), $lt: end.getTime() },
        },
      },
      {
        $group: {
          _id: 'creator',
          total: { $sum: 1 },
        },
      },
    ]);

    let newQuestProcess: QuestProcessDocument = null;
    if (
      flexHausDonated.length > 0 &&
      flexHausDonated[0].total >= quest.amountOfTask
    ) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }

      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (flexHausDonated.length > 0) {
      if (questProcess) {
        questProcess.processOfTask = flexHausDonated[0].total;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: flexHausDonated[0].total,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }
  }

  async verifyCreateFlexDrop(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const flexHausDrops = await this.flexHausDropModel.countDocuments({
      creator: userDocument._id,
      createdAt: { $gte: start.getTime(), $lt: end.getTime() },
    });

    let newQuestProcess: QuestProcessDocument = null;
    if (flexHausDrops >= quest.amountOfTask) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (flexHausDrops > 0) {
      if (questProcess) {
        questProcess.processOfTask = flexHausDrops;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: flexHausDrops,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }
  }

  async verifyBidNFT(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const signatures = await this.signatureModel.countDocuments({
      signer: userDocument.address,
      status: SignStatusEnum.BID,
      createdAt: { $gte: start.getTime(), $lt: end.getTime() },
    });

    let newQuestProcess: QuestProcessDocument = null;
    if (signatures >= quest.amountOfTask) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (signatures > 0) {
      if (questProcess) {
        questProcess.processOfTask = signatures;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: signatures,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }
  }

  async verifyListNFT(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const signatures = await this.signatureModel.countDocuments({
      signer: userDocument.address,
      status: SignStatusEnum.LISTING,
      createdAt: { $gte: start.getTime(), $lt: end.getTime() },
    });

    let newQuestProcess: QuestProcessDocument = null;
    if (signatures >= quest.amountOfTask) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (signatures > 0) {
      if (questProcess) {
        questProcess.processOfTask = signatures;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: signatures,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }
  }

  async verifyBuyNFT(
    questProcess: QuestProcessDocument,
    quest: QuestDocument,
    userDocument: UserDocument,
    time: number,
  ) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const signatures = await this.signatureModel.countDocuments({
      buyer_address: userDocument.address,
      status: SignStatusEnum.SOLD,
      signature4: { $exists: true },
      createdAt: { $gte: start.getTime(), $lt: end.getTime() },
    });

    let newQuestProcess: QuestProcessDocument = null;
    if (signatures >= quest.amountOfTask) {
      if (questProcess) {
        questProcess.processOfTask = quest.amountOfTask;
        questProcess.isVerified = true;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: quest.amountOfTask,
        isVerified: true,
        processTime: time,
      });
    } else if (signatures > 0) {
      if (questProcess) {
        questProcess.processOfTask = signatures;
        questProcess.isVerified = false;
        questProcess.processTime = time;
        return questProcess.save();
      }
      newQuestProcess = new this.questProcessModel({
        user: userDocument._id,
        quest: quest._id,
        processOfTask: signatures,
        isVerified: false,
        processTime: time,
      });
    } else {
      if (!questProcess) {
        newQuestProcess = new this.questProcessModel({
          user: userDocument._id,
          quest: quest._id,
          processOfTask: 0,
          isVerified: false,
          processTime: time,
        });
      } else {
        return questProcess;
      }
    }

    if (newQuestProcess) {
      return await newQuestProcess.save();
    }
  }

  async claimReward(body: VerifyQuestProcessDto, user: string) {
    const { questId } = body;
    const userDocument = await this.userService.getOrCreateUser(user);

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const quest = await this.questModel.findById(questId);
    if (!quest) {
      throw new HttpException('Quest not found', HttpStatus.NOT_FOUND);
    }

    const questProcess = await this.questProcessModel.findOne({
      user: userDocument._id,
      quest: questId,
      processTime: { $gte: start.getTime(), $lt: end.getTime() },
    });

    if (!questProcess || !questProcess.isVerified) {
      throw new HttpException('Quest not verified yet', HttpStatus.NOT_FOUND);
    }

    if (questProcess.isClaimed) {
      throw new HttpException('Quest already claimed', HttpStatus.NOT_FOUND);
    }

    const reward = quest.reward;
    await this.userModel.findOneAndUpdate(
      {
        _id: userDocument._id,
      },
      { $inc: { flexPoint: reward } },
    );

    questProcess.isClaimed = true;
    return await questProcess.save();
  }
}
