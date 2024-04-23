import { JOB_QUEUE_NFT_METADATA, QUEUE_METADATA } from '@app/shared/types';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MetadataService } from '../metadata.service';
import { Logger } from '@nestjs/common';

@Processor(QUEUE_METADATA)
export class FetchMetadataProcessor {
  constructor(private readonly metadataService: MetadataService) {}
  logger = new Logger(FetchMetadataProcessor.name);

  @Process({ name: JOB_QUEUE_NFT_METADATA, concurrency: 20 })
  async fetchHandle(job: Job<string>) {
    try {
      await this.metadataService.loadMetadata(job.data);
      this.logger.log(
        `Processing type ${job.name} with  id ${job.data} in ${
          (Date.now() - job.processedOn) / 1e3
        }s`,
      );
    } catch (err) {
      this.logger.error(
        `Error while processing type ${job.name} with  id ${job.data} `,
        err,
      );
    }
  }
}
