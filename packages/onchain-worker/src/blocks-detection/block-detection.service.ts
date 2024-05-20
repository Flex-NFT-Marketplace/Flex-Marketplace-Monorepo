import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { OnchainWorker } from '../onchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3-service/web3.service';
import { BlockStatus, Block, Provider, RpcProvider } from 'starknet';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { NftItemService } from './nft-item.service';
import { retryUntil } from '@app/shared';
import { EventType } from '@app/web3-service/types';
import { MailingService } from '../mailing/mailing.service';

export class BlockDetectionService extends OnchainWorker {
  constructor(
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
    nftItemService: NftItemService,
    mailingSerivce: MailingService,
  ) {
    super(1000, 10, `${BlockDetectionService.name}:${chain.name}`);
    this.logger.log('Created');
    this.web3Service = web3Service;
    this.nftItemService = nftItemService;
    this.mailingSerivce = mailingSerivce;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
  }
  chainId: string;
  web3Service: Web3Service;
  mailingSerivce: MailingService;
  provider: Provider;
  chain: ChainDocument;
  nftItemService: NftItemService;
  blockModel: Model<BlockDocument>;

  fetchLatestBlock: () => Promise<number> = async () => {
    const latestBlock = await this.provider.getBlock('latest');
    return latestBlock.block_number - Number(this.chain.delayBlock || 0);
  };

  init = async () => {
    const latestBlock = await this.blockModel
      .findOne({
        status: BlockWorkerStatus.SUCCESS,
      })
      .sort({ blockNumber: -1 });
    this.currentBlock =
      (latestBlock?.blockNumber || configuration().begin_block - 1) + 1;
    this.provider = new RpcProvider({ nodeUrl: this.chain.rpc });
    this.logger.log(`chain: ${JSON.stringify(this.chain)}`);
  };

  fillBlockDataBuffer = async (
    blocks: number[],
  ): Promise<{ [k: number]: Block }> => {
    const dataBlocks = await Promise.all(
      blocks.map(async b => this.provider.getBlock(b)),
    );

    const groupByBlock: { [k: number]: Block } = dataBlocks.reduce(
      (acc, cur) => {
        if (
          cur.status == BlockStatus.ACCEPTED_ON_L2 ||
          cur.status == BlockStatus.ACCEPTED_ON_L1
        ) {
          acc[cur.block_number] = cur;
          return acc;
        }
      },
      {},
    );

    return groupByBlock;
  };

  process = async (block: Block): Promise<void> => {
    const beginTime = Date.now();
    this.logger.debug(
      `begin process block ${Number(block.block_number)} ${
        block.transactions.length
      } txs`,
    );
    //insert to db
    const blockEntity = await this.blockModel.findOneAndUpdate(
      {
        blockNumber: block.block_number,
        chain: this.chain.name,
      },
      {
        $setOnInsert: {
          blockNumber: block.block_number,
          chain: this.chain.name,
          transactions: block.transactions,
          status: BlockWorkerStatus.PENDING,
          timestamp: block.timestamp * 1e3,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const batchProcess = 100;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      block.transactions,
      async txs => {
        await Promise.all(
          txs.map(async tx => {
            await retryUntil(
              async () => this.processTx(tx, block.timestamp * 1e3),
              () => true,
              maxRetry,
            );
          }),
        );
      },
      batchProcess,
    );
    blockEntity.status = BlockWorkerStatus.SUCCESS;
    await blockEntity.save();

    this.logger.debug(
      `end process block ${Number(block.block_number)} ${block.transactions.length}txs in ${
        Date.now() - beginTime
      }ms`,
    );
  };

  async processTx(txHash: string, timestamp: number) {
    try {
      const trasactionReceipt =
        await this.provider.getTransactionReceipt(txHash);
      if (!trasactionReceipt) {
        // throw new Error(`Can not get transaction receipt ${txHash}`);
        return undefined;
      }

      //parse event
      const eventWithType = this.web3Service.getReturnValuesEvent(
        trasactionReceipt,
        this.chain,
        timestamp,
      );

      const matchTakerAskEv = eventWithType.filter(
        ev => ev.eventType === EventType.TAKER_ASK,
      );

      const matchTakerBidEv = eventWithType.filter(
        ev => ev.eventType === EventType.TAKER_BID,
      );

      const flexDropMintedEv = eventWithType.filter(
        ev => ev.eventType === EventType.FLEX_DROP_MINTED,
      );

      const deployContractEv = eventWithType.filter(
        ev => ev.eventType === EventType.DEPLOY_CONTRACT,
      );

      // skip transfer event if it is sale or accept offer or flexdrop minted -> prevent duplicate event
      const eventlogs = eventWithType.filter(ev => {
        if (
          ev.eventType === EventType.TRANSFER_721 ||
          ev.eventType === EventType.TRANSFER_1155
        ) {
          return (
            !matchTakerAskEv.find(
              e => e.transaction_hash === ev.transaction_hash,
            ) &&
            !matchTakerBidEv.find(
              e => e.transaction_hash === ev.transaction_hash,
            )
          );
        }

        if (ev.eventType === EventType.FLEX_DROP_MINTED) {
          return false;
        }

        if (ev.eventType === EventType.UPGRADE_CONTRACT) {
          return !deployContractEv.find(
            e => e.transaction_hash === ev.transaction_hash,
          );
        }

        return true;
      });

      for (const ev of flexDropMintedEv) {
        eventlogs.map(log => {
          if (
            (log.eventType === EventType.MINT_1155 ||
              log.eventType === EventType.MINT_721) &&
            log.returnValues.nftAddress === ev.returnValues.nftAddress
          ) {
            log.returnValues.isFlexDropMinted = true;
            log.returnValues.price =
              ev.returnValues.totalMintPrice / ev.returnValues.quantityMinted;
          }
        });
      }

      //process event
      let index = 0;
      for (const event of eventlogs) {
        await this.nftItemService.processEvent(event, this.chain, index);
        index++;
      }
      return trasactionReceipt;
    } catch (error) {
      await this.mailingSerivce.sendMail(
        `Failed to fetch data of tx hash - ${txHash}`,
      );
      throw new Error(`Failed to fetch data of tx Hash - ${txHash}`);
    }
  }
}
