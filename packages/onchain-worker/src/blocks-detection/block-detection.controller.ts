import { Controller } from '@nestjs/common';
import { BlockDetectionService } from './block-detection.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlockDocument,
  Blocks,
  ChainDocument,
  Chains,
} from '@app/shared/models';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3-service/web3.service';

import { ONCHAIN_QUEUES } from '@app/shared/types';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { LogsReturnValues } from '@app/web3-service/types';
import { OnchainQueueService } from '@app/shared/utils/queue';

@Controller('block-detection')
export class BlockDetectionController {
  constructor(
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    @InjectModel(Blocks.name)
    private readonly blockModel: Model<BlockDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_CANCEL_ALL_ORDERS)
    private readonly cancelAllOrdersQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_CANCEL_OFFER)
    private readonly cancelOfferQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_CREATOR_PAYOUT_UPDATED)
    private readonly creatorPayoutQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_DEPLOY_CONTRACT)
    private readonly deployContractQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_BURN_721)
    private readonly erc721BurnQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_MINT_721)
    private readonly erc721MintQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_TRANSFER_721)
    private readonly erc721TransferQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_BURN_1155)
    private readonly erc1155BurnQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_MINT_1155)
    private readonly erc1155MintQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_TRANSFER_1155)
    private readonly erc1155TransferQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_PAYER_UPDATED)
    private readonly payerUpdateQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_PHASE_DROP_UPDATED)
    private readonly phaseDropQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_TAKER_ASK)
    private readonly takerAskQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_TAKER_BID)
    private readonly takerBidQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_UPGRADE_CONTRACT)
    private readonly upgradeContractQueue: Queue<LogsReturnValues>,
    private readonly onchainQueueService: OnchainQueueService,
    private readonly web3Service: Web3Service,
  ) {
    if (!this.listeners) this.init();
  }
  listeners: BlockDetectionService[];

  async init() {
    const chains = await this.chainModel.find();
    this.listeners = chains
      .filter(chain => chain.currentMarketplaceContract)
      .map(
        chain =>
          new BlockDetectionService(
            this.cancelAllOrdersQueue,
            this.cancelOfferQueue,
            this.creatorPayoutQueue,
            this.deployContractQueue,
            this.erc721BurnQueue,
            this.erc721MintQueue,
            this.erc721TransferQueue,
            this.erc1155BurnQueue,
            this.erc1155MintQueue,
            this.erc1155TransferQueue,
            this.payerUpdateQueue,
            this.phaseDropQueue,
            this.takerAskQueue,
            this.takerBidQueue,
            this.upgradeContractQueue,
            this.onchainQueueService,
            this.blockModel,
            this.web3Service,
            chain,
          ),
      );

    for (const job of this.listeners) {
      job.start();
    }
  }
}
