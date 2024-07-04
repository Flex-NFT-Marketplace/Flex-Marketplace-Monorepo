import { delay } from '@app/shared/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class OnchainQueueService {
  logger = new Logger(OnchainQueueService.name);
  queueMaxSize = 10000;
  add = async (
    eventQueue: Queue<any>,
    jobName: string,
    payload: any,
    ignoreError = true,
  ) => {
    try {
      let isFull = true;
      while (isFull) {
        const count = await eventQueue.count();

        if (count > this.queueMaxSize) {
          this.logger.warn(
            `Max queue waiting ${eventQueue.name} job exception.Waiting job is ${count}, limit: ${this.queueMaxSize}`,
          );
          await delay(1);
        } else {
          isFull = false;
        }
      }

      return await eventQueue.add(jobName, payload);
    } catch (error) {
      this.logger.warn(error);
      if (ignoreError) {
        throw error;
      }
    }
  };
}
