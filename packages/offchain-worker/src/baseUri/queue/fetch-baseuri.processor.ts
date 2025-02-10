import {
  JOB_QUEUE_COLLECTIBLE_BASE_URI,
  QUEUE_BASE_URI,
  QUEUE_METADATA,
} from '@app/shared/types';
import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { BaseUriService } from '../baseuri.service';

@Processor(QUEUE_BASE_URI)
export class FetchBaseUriProcessor {
  constructor(
    private readonly baseUriService: BaseUriService,
    @InjectQueue(QUEUE_BASE_URI)
    private readonly queue: Queue<string>,
  ) {}
  logger = new Logger(FetchBaseUriProcessor.name);

  @Process({ name: JOB_QUEUE_COLLECTIBLE_BASE_URI, concurrency: 10 })
  async fetchHandle(job: Job<string>) {
    try {
      await this.baseUriService.loadBaseUri(job.data);
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
