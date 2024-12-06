import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SignatureService } from '../signature.service';

@Injectable()
export class CronService {
  private isJobTxRunning = false;
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly signatureService: SignatureService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    if (this.isJobTxRunning) {
      return;
    }

    this.isJobTxRunning = true;

    try {
      await this.signatureService.syncTx();
    } catch (error) {
      this.logger.error('Error executing SyncTx', error);
    } finally {
      this.isJobTxRunning = false;
    }
  }
}
