import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  FlexHausDonateDocument,
  FlexHausDonates,
  FlexHausDrop,
  FlexHausDropDocument,
  FlexHausDropType,
  FlexHausEventDocument,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleDocument,
  FlexHausSet,
  FlexHausSetDocument,
  FlexHausSubscription,
  FlexHausSubscriptionDocument,
  NftCollectionDocument,
} from '@app/shared/models';
import { arraySliceProcess } from '@app/shared/utils';

@Injectable()
export class FlexHausDropTaskService {
  isRunning = false;
  private logger: Logger = new Logger(FlexHausDropTaskService.name);

  constructor(
    @InjectModel(FlexHausSet.name)
    private readonly flexHausSetModel: Model<FlexHausSetDocument>,
    @InjectModel(FlexHausDrop.name)
    private readonly flexHausDropModel: Model<FlexHausDropDocument>,
    @InjectModel(FlexHausDonates.name)
    private readonly flexHausDonatesModel: Model<FlexHausDonateDocument>,
    @InjectModel(FlexHausSecureCollectible.name)
    private readonly flexHausSecureCollectibleModel: Model<FlexHausSecureCollectibleDocument>,
    @InjectModel(FlexHausSubscription.name)
    private readonly flexHausSubscriptionModel: Model<FlexHausSubscriptionDocument>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleDistributeCollectibles() {
    if (this.isRunning) return;

    this.isRunning = true;
    const now = Date.now();

    try {
      const sets = await this.flexHausSetModel
        .find(
          {
            expiryTime: { $lte: now },
            isDistributed: false,
          },
          {},
          { limit: 5 },
        )
        .populate([
          {
            path: 'collectibles',
          },
          {
            path: 'event',
          },
        ]);

      for (const set of sets) {
        await this.process(set);
        set.isDistributed = true;
        await set.save();
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.isRunning = false;
    }
  }

  async process(set: FlexHausSetDocument) {
    const { collectibles, event } = set;
    await arraySliceProcess(
      collectibles,
      async slicedCol => {
        await Promise.all(
          slicedCol.map(async col => {
            const dropDetail = await this.flexHausDropModel.findOne({
              collectible: col._id,
            });

            let distributedAmount = 0;
            if (
              event &&
              !event.isCancelled &&
              dropDetail.fromTopSupporter !== 0 &&
              dropDetail.toTopSupporter !== 0
            ) {
              distributedAmount = await this.distrubiteToTopSupporter(
                event,
                col,
                dropDetail.fromTopSupporter,
                dropDetail.toTopSupporter,
              );
            }

            if (
              (!event || !event.isCancelled) &&
              dropDetail.dropType === FlexHausDropType.Protected
            ) {
              const totalSecuredCollectibles =
                await this.distributeToSecured(col);
              distributedAmount += totalSecuredCollectibles;
            }

            if (
              (!event || !event.isCancelled) &&
              dropDetail.isRandomToSubscribers &&
              col.dropAmount > distributedAmount
            ) {
              await this.distributeToRandom(
                col,
                col.dropAmount - distributedAmount,
              );
            }
          }),
        );
      },
      3,
    );
  }

  async distrubiteToTopSupporter(
    event: FlexHausEventDocument,
    collectible: NftCollectionDocument,
    fromTopSupporter: number,
    toTopSupporter: number,
  ): Promise<number> {
    const total = await this.flexHausDonatesModel.aggregate([
      {
        $match: {
          event,
        },
      },
      {
        $group: {
          _id: '$user',
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $skip: fromTopSupporter - 1,
      },
      {
        $limit: toTopSupporter - fromTopSupporter + 1,
      },
      {
        $group: {
          _id: 0,
          count: { $sum: 1 },
        },
      },
    ]);

    if (total.length === 0 || total[0].total === 0) {
      return 0;
    }

    let i = 0;
    do {
      const topSupporters = await this.flexHausDonatesModel.aggregate([
        {
          $match: {
            event,
          },
        },
        {
          $group: {
            _id: '$user',
            total: { $sum: '$amount' },
          },
        },
        {
          $sort: { total: -1 },
        },
        {
          $skip: fromTopSupporter - 1 + i,
        },
        {
          $limit: toTopSupporter - fromTopSupporter + 1 + i,
        },
      ]);

      for (const item of topSupporters) {
        const { _id } = item;
        await this.flexHausSecureCollectibleModel.findOneAndUpdate(
          {
            user: _id,
            collectible,
            isSecured: false,
          },
          { $set: { isDistributed: true } },
          { upsert: true, new: true },
        );
      }
    } while (i < total[0].total);

    return total[0].total;
  }

  async distributeToSecured(
    collectible: NftCollectionDocument,
  ): Promise<number> {
    const totalSecuredCollectibles =
      await this.flexHausSecureCollectibleModel.countDocuments({
        collectible,
        isSecured: true,
      });

    if (totalSecuredCollectibles == 0) {
      return 0;
    }

    await this.flexHausSecureCollectibleModel.updateMany(
      {
        collectible,
        isSecured: true,
      },
      {
        $set: {
          isDistributed: true,
        },
      },
    );

    return totalSecuredCollectibles;
  }

  async distributeToRandom(
    collectible: NftCollectionDocument,
    amount: number,
  ): Promise<number> {
    const subscribers: FlexHausSubscriptionDocument[] = [];
    while (subscribers.length != amount) {
      const selectSubscribers: FlexHausSubscriptionDocument[] =
        await this.flexHausSubscriptionModel.aggregate([
          {
            $match: {
              creator: collectible.owner,
              isUnSubscribe: false,
            },
          },
          {
            $sample: { size: amount - subscribers.length },
          },
        ]);
      for (const subscriber of selectSubscribers) {
        if (!subscribers.find(i => i.user === subscriber.user)) {
          const secureCollectible =
            await this.flexHausSecureCollectibleModel.findOne({
              user: subscriber.user,
              collectible,
            });

          if (!secureCollectible) {
            subscribers.push(subscriber);
          }
        }
      }
    }

    const bulkInsert = [];
    for (const subscriber of subscribers) {
      bulkInsert.push({
        insertOne: {
          document: {
            user: subscriber.user,
            collectible,
            isSecured: false,
            isDistributed: true,
          },
        },
      });
    }

    await this.flexHausSecureCollectibleModel.bulkWrite(bulkInsert);
    return amount;
  }
}
