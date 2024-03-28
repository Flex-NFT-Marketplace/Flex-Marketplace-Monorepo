import { GatewayTimeoutException, Logger } from '@nestjs/common';
import { BlockedQueue } from '@app/shared/BlockedQueue';
import { delay } from '@app/shared/utils/promise';
import { Block } from 'starknet';

export abstract class OnchainWorker {
  currentBlock: number;
  blockNumberBuffer: BlockedQueue<number>;
  blockDataBuffer: BlockedQueue<Block>;
  maxBlockSize: number;
  maxBatchSize: number;
  delayFetchBlock = 3;
  abstract init: () => Promise<void>;
  abstract fetchLatestBlock: () => Promise<number>;
  abstract fillBlockDataBuffer: (
    blocks: number[],
  ) => Promise<{ [k: number]: Block }>;
  abstract process: (data: Block) => Promise<void>;
  shutdown = false;
  private running = false;
  get isRunning(): boolean {
    return this.running;
  }
  name: string;

  logger: Logger;
  processing = false;

  constructor(maxBlockSize: number, maxBatchSize: number, name: string) {
    this.maxBlockSize = maxBlockSize;
    this.maxBatchSize = maxBatchSize;
    this.blockNumberBuffer = new BlockedQueue<number>(maxBlockSize);
    this.blockDataBuffer = new BlockedQueue(maxBatchSize);
    this.name = name;
    this.logger = new Logger(name);
  }

  async fetchBlockNumber() {
    while (!this.shutdown) {
      while (this.blockNumberBuffer.freeSize === 0) {
        await delay(1);
      }
      try {
        const latestBlock = await Promise.race([
          this.fetchLatestBlock(),
          delay(9),
        ]);
        if (!latestBlock)
          throw new GatewayTimeoutException('fetchBlockNumber timeout');
        for (
          this.currentBlock;
          this.currentBlock <= latestBlock;
          this.currentBlock++
        ) {
          this.blockNumberBuffer.put(this.currentBlock);
        }
      } catch (error) {
        this.logger.error(error, error.stack);
        this.logger.warn('Fail to fetchBlockNumber. Try again ...');
      }
      await delay(this.delayFetchBlock);
    }
  }

  async processBlocks() {
    while (!this.shutdown) {
      const data = await this.blockDataBuffer.take();
      let done = false;
      while (!done) {
        try {
          await this.process(data);
          done = true;
        } catch (error) {
          this.logger.error(error, error.stack);
          this.logger.error(JSON.stringify(data));
          this.logger.warn('Fail of process block data. Try again ...');
          await delay(1);
        }
      }
    }
  }

  /**
   * Fetch block data and push to blockDataBuffer
   */
  async fetchBlockData() {
    while (!this.shutdown) {
      try {
        while (this.blockDataBuffer.freeSize === 0) {
          await delay(0.1);
        }
        const blocks = await this.blockNumberBuffer.takeAll(this.maxBatchSize);
        let done = false;
        while (!done) {
          try {
            const begin = new Date();
            let data: {
              [k: number]: Block;
            } | void = undefined;

            let dataKeys = {} as any;

            // get block data
            while (!data) {
              data = await Promise.race([
                this.fillBlockDataBuffer(blocks),
                delay(300),
              ]);
              if (!data) this.logger.error('fillBlockDataBuffer timeout');
              dataKeys = Object.keys(data || {});
            }

            // push block data to queue
            if (Number(dataKeys.length) > 0) {
              for (let i = 0; i < Number(dataKeys.length); i++) {
                try {
                  this.blockDataBuffer.put(data[dataKeys[i]]);
                } catch (error) {
                  // this.logger.error(error);
                  i--; //retry
                  await delay(0.1);
                }
              }
            }
            this.logger.log(
              `fetchBlockData ${blocks[0]}${
                blocks.length > 1 ? ' -> ' + blocks[blocks.length - 1] : ''
              } in ${(Date.now() - begin.getTime()) / 1e3}s`,
            );
            done = true;
          } catch (error) {
            this.logger.error(error, error.stack);
            this.logger.warn('Fail to fetchBlockData. Try again ...');
            await delay(1);
          }
        }
      } catch (error) {
        this.logger.error(error, error.stack);
        this.logger.warn('Fail to fetchBlockData. Try again ...');
        await delay(1);
      }
    }
  }
  async start() {
    if (this.running) return;
    this.running = true;
    this.shutdown = false;
    this.logger.log('init');
    await this.init();
    this.logger.log('started');
    await Promise.all([
      this.fetchBlockNumber(),
      this.fetchBlockData(),
      this.processBlocks(),
    ]);
    this.running = false;
    this.logger.log('stopped');
  }
  onApplicationShutdown(): void {
    this.shutdown = true;
  }
  stop() {
    this.shutdown = true;
  }
}
