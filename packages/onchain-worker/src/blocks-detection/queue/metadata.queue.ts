import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JOB_QUEUE_NFT_METADATA, QUEUE_METADATA } from '@app/shared/types';
import { Queue } from 'bull';

@Injectable()
export class MetadataQueueService {
  constructor(
    @InjectQueue(QUEUE_METADATA)
    private readonly metadataQueue: Queue<string>,
  ) {}

  logger = new Logger(MetadataQueueService.name);
  queueMaxSize = 10000;
  add = async (id: string, ignoreError = true) => {
    try {
      const count = await this.metadataQueue.count();

      if (count > this.queueMaxSize) {
        throw new Error(
          `Max queue waiting job exception.Waiting job is ${count}, limit: ${this.queueMaxSize}`,
        );
      }
      return await this.metadataQueue.add(JOB_QUEUE_NFT_METADATA, id);
    } catch (error) {
      this.logger.warn(error);
      if (ignoreError) {
        throw error;
      }
    }
  };
  addBulk = async (ids: string[], ignoreError = true) => {
    try {
      const count = await this.metadataQueue.count();
      if (count > this.queueMaxSize + ids.length) {
        throw new Error(
          `Max queue waiting job exception.Waiting job is ${count}, limit: ${this.queueMaxSize}`,
        );
      }

      const jobs: { name: string; data: string }[] = [];
      for (const id of ids) {
        jobs.push({
          name: JOB_QUEUE_NFT_METADATA,
          data: id,
        });
      }

      return await this.metadataQueue.addBulk(jobs);
    } catch (error) {
      this.logger.warn(error);
      if (!ignoreError) {
        throw error;
      }
    }
  };
}
