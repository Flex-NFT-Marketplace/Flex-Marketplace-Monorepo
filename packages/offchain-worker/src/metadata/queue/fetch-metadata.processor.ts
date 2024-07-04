import { JOB_QUEUE_NFT_METADATA, QUEUE_METADATA } from '@app/shared/types';
import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { MetadataService } from '../metadata.service';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';

@Processor(QUEUE_METADATA)
export class FetchMetadataProcessor {
  constructor(
    private readonly metadataService: MetadataService,
    @InjectQueue(QUEUE_METADATA)
    private readonly queue: Queue<string>,
  ) {}
  logger = new Logger(FetchMetadataProcessor.name);

  @Process({ name: JOB_QUEUE_NFT_METADATA, concurrency: 100 })
  async fetchHandle(job: Job<string>) {
    try {
      await this.metadataService.loadMetadata(job.data);
      this.logger.log(
        `Processing type ${job.name} with  id ${job.data} in ${
          (Date.now() - job.processedOn) / 1e3
        }s`,
      );
    } catch (err) {
      await this.queue.add(JOB_QUEUE_NFT_METADATA, job.data);
      this.logger.error(
        `Error while processing type ${job.name} with  id ${job.data} `,
        err,
      );
    }
  }
}
