import { ONCHAIN_JOBS, ONCHAIN_QUEUES } from '@app/shared/types';
import { LogsReturnValues } from '@app/web3-service/types';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NftItemService } from '../nft-item.service';
import { InjectModel } from '@nestjs/mongoose';
import { ChainDocument, Chains } from '@app/shared/models';
import { Model } from 'mongoose';
import { retryUntil } from '@app/shared/index';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor(ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_1155)
export class ERC1155UpdateMetadataProcessor {
  constructor(
    private readonly nftItemService: NftItemService,
    @InjectModel(Chains.name) private readonly chainModel: Model<ChainDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_UPDATE_METADATA_1155)
    private readonly queue: Queue<LogsReturnValues>,
  ) {}

  logger = new Logger(ERC1155UpdateMetadataProcessor.name);

  @Process({ name: ONCHAIN_JOBS.JOB_UPDATE_METADATA_1155, concurrency: 100 })
  async detectEvent(job: Job<LogsReturnValues>) {
    const event = job.data;
    const maxRetry = 10;
    const chain = await this.chainModel.findOne();

    try {
      await retryUntil(
        async () =>
          await this.nftItemService.processEvent(event, chain, event.index),
        () => true,
        maxRetry,
      );
    } catch (error) {
      this.logger.error(`Failed to detect tx hash ${event.transaction_hash}`);
      this.queue.add(ONCHAIN_JOBS.JOB_UPDATE_METADATA_1155, event);
    }
  }
}
