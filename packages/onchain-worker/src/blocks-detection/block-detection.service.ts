import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { OnchainWorker } from '../onchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
  NftCollectionDocument,
  TransactionWorkerStatus,
  TransactionWorkerType,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3-service/web3.service';
import { BlockStatus, GetBlockResponse, Provider, RpcProvider } from 'starknet';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { retryUntil } from '@app/shared';
import { EventType, LogsReturnValues } from '@app/web3-service/types';
import { ONCHAIN_JOBS } from '@app/shared/types';
import { Queue } from 'bull';
import { ERC721OrERC20TransferReturnValue } from '@app/web3-service/decodeEvent';
import { OnchainQueueService } from '@app/shared/utils/queue';
import * as _ from 'lodash';
import { ContractStandard } from '@app/shared/models';

export class BlockDetectionService extends OnchainWorker {
  constructor(
    cancelAllOrdersQueue: Queue<LogsReturnValues>,
    cancelOfferQueue: Queue<LogsReturnValues>,
    creatorPayoutQueue: Queue<LogsReturnValues>,
    deployContractQueue: Queue<LogsReturnValues>,
    erc20TransferQueue: Queue<LogsReturnValues>,
    erc721BurnQueue: Queue<LogsReturnValues>,
    erc721MintQueue: Queue<LogsReturnValues>,
    erc721TransferQueue: Queue<LogsReturnValues>,
    erc1155BurnQueue: Queue<LogsReturnValues>,
    erc1155MintQueue: Queue<LogsReturnValues>,
    erc1155TransferQueue: Queue<LogsReturnValues>,
    payerUpdateQueue: Queue<LogsReturnValues>,
    phaseDropQueue: Queue<LogsReturnValues>,
    takerAskQueue: Queue<LogsReturnValues>,
    takerBidQueue: Queue<LogsReturnValues>,
    upgradeContractQueue: Queue<LogsReturnValues>,
    itemStakedQueue: Queue<LogsReturnValues>,
    itemUnstakedQueue: Queue<LogsReturnValues>,
    updateDropQueue: Queue<LogsReturnValues>,
    onchainQueue: OnchainQueueService,
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
    nftCollectionModel: Model<NftCollectionDocument>,
  ) {
    super(1000, 10, `${BlockDetectionService.name}:${chain.name}`);
    this.logger.log('Created');
    this.web3Service = web3Service;
    this.cancelAllOrdersQueue = cancelAllOrdersQueue;
    this.cancelOfferQueue = cancelOfferQueue;
    this.creatorPayoutQueue = creatorPayoutQueue;
    this.deployContractQueue = deployContractQueue;
    this.erc20TransferQueue = erc20TransferQueue;
    this.erc721BurnQueue = erc721BurnQueue;
    this.erc721MintQueue = erc721MintQueue;
    this.erc721TransferQueue = erc721TransferQueue;
    this.erc1155BurnQueue = erc1155BurnQueue;
    this.erc1155MintQueue = erc1155MintQueue;
    this.erc1155TransferQueue = erc1155TransferQueue;
    this.payerUpdateQueue = payerUpdateQueue;
    this.phaseDropQueue = phaseDropQueue;
    this.takerAskQueue = takerAskQueue;
    this.takerBidQueue = takerBidQueue;
    this.upgradeContractQueue = upgradeContractQueue;
    this.itemStakedQueue = itemStakedQueue;
    this.itemUnstakedQueue = itemUnstakedQueue;
    this.updateDropQueue = updateDropQueue;
    this.onchainQueue = onchainQueue;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
    this.nftCollectionModel = nftCollectionModel;
  }
  chainId: string;
  web3Service: Web3Service;
  onchainQueue: OnchainQueueService;
  provider: Provider;
  chain: ChainDocument;
  cancelAllOrdersQueue: Queue<LogsReturnValues>;
  cancelOfferQueue: Queue<LogsReturnValues>;
  creatorPayoutQueue: Queue<LogsReturnValues>;
  deployContractQueue: Queue<LogsReturnValues>;
  erc20TransferQueue: Queue<LogsReturnValues>;
  erc721BurnQueue: Queue<LogsReturnValues>;
  erc721MintQueue: Queue<LogsReturnValues>;
  erc721TransferQueue: Queue<LogsReturnValues>;
  erc1155BurnQueue: Queue<LogsReturnValues>;
  erc1155MintQueue: Queue<LogsReturnValues>;
  erc1155TransferQueue: Queue<LogsReturnValues>;
  payerUpdateQueue: Queue<LogsReturnValues>;
  phaseDropQueue: Queue<LogsReturnValues>;
  takerAskQueue: Queue<LogsReturnValues>;
  takerBidQueue: Queue<LogsReturnValues>;
  upgradeContractQueue: Queue<LogsReturnValues>;
  itemStakedQueue: Queue<LogsReturnValues>;
  itemUnstakedQueue: Queue<LogsReturnValues>;
  updateDropQueue: Queue<LogsReturnValues>;
  blockModel: Model<BlockDocument>;
  nftCollectionModel: Model<NftCollectionDocument>;

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
    blocks: (number | 'pending')[],
  ): Promise<{ [k: number]: GetBlockResponse }> => {
    const dataBlocks = await Promise.all(
      blocks.map(async b => this.provider.getBlock(b)),
    );

    const groupByBlock: { [k: number]: GetBlockResponse } = dataBlocks.reduce(
      (acc, cur) => {
        if (
          cur.status == BlockStatus.ACCEPTED_ON_L2 ||
          cur.status == BlockStatus.ACCEPTED_ON_L1
        ) {
          acc[cur.block_number] = cur;
          return acc;
        }

        if (cur.status == BlockStatus.PENDING) {
          acc[this.pendingBlock] = cur;
          return acc;
        }
      },
      {},
    );

    return groupByBlock;
  };

  process = async (block: GetBlockResponse): Promise<void> => {
    const beginTime = Date.now();
    let blockNumber =
      block.status == BlockStatus.ACCEPTED_ON_L2 ||
      block.status == BlockStatus.ACCEPTED_ON_L1
        ? block.block_number
        : this.pendingBlock;

    this.logger.debug(
      `begin process block ${Number(blockNumber)} ${
        block.transactions.length
      } txs`,
    );
    let transactionWorker: TransactionWorkerType[] = block.transactions.map(
      tx => {
        return { txHash: tx, status: TransactionWorkerStatus.PENDING };
      },
    );

    let blockEntity = await this.blockModel.findOne({
      blockNumber: blockNumber,
      chain: this.chainId,
    });

    if (!blockEntity) {
      //insert to db
      blockEntity = await this.blockModel.findOneAndUpdate(
        {
          blockNumber: blockNumber,
          chain: this.chainId,
        },
        {
          $setOnInsert: {
            blockNumber: blockNumber,
            chain: this.chainId,
            transactions: transactionWorker,
            status: BlockWorkerStatus.PENDING,
            timestamp: block.timestamp * 1e3,
          },
        },
        {
          upsert: true,
          new: true,
        },
      );
    } else {
      transactionWorker = _.unionBy(
        blockEntity.transactions,
        transactionWorker,
        'txHash',
      );
    }

    const batchProcess = 10;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      transactionWorker,
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

    if (blockNumber !== this.pendingBlock) {
      blockEntity.status = BlockWorkerStatus.SUCCESS;
    }
    blockEntity.transactions = transactionWorker;
    await this.blockModel.findOneAndUpdate(
      { blockNumber: blockEntity.blockNumber },
      { $set: blockEntity },
      { upsert: true },
    );

    this.logger.debug(
      `end process block ${Number(blockNumber)} ${block.transactions.length}txs in ${
        Date.now() - beginTime
      }ms`,
    );
  };

  async processTx(tx: TransactionWorkerType, timestamp: number) {
    try {
      const { status, txHash } = tx;
      if (status == TransactionWorkerStatus.SUCCESS) {
        return tx;
      }

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

      for (const event of eventWithType) {
        switch (event.eventType) {
          case EventType.UNKNOWN_BURN:
          case EventType.UNKNOWN_MINT:
          case EventType.UNKNOWN_TRANSFER:
            const { contractAddress } =
              event.returnValues as ERC721OrERC20TransferReturnValue;
            const contractStandard =
              await this.getCollectionStandard(contractAddress);

            if (!contractStandard) {
              break;
            }

            if (contractStandard === ContractStandard.ERC20) {
              event.eventType =
                event.eventType === EventType.UNKNOWN_BURN
                  ? EventType.BURN_20
                  : event.eventType === EventType.UNKNOWN_MINT
                    ? EventType.MINT_20
                    : EventType.TRANSFER_20;
            } else {
              event.eventType =
                event.eventType === EventType.UNKNOWN_BURN
                  ? EventType.BURN_721
                  : event.eventType === EventType.UNKNOWN_MINT
                    ? EventType.MINT_721
                    : EventType.TRANSFER_721;
            }
            break;
          default:
            break;
        }
      }

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

      const claimPointEv = eventWithType.filter(
        ev => ev.eventType === EventType.CLAIM_POINT,
      );

      const itemStakedEv = eventWithType.filter(
        ev => ev.eventType === EventType.ITEM_STAKED,
      );

      const itemUnstakedEv = eventWithType.filter(
        ev => ev.eventType === EventType.ITEM_UNSTAKED,
      );

      const claimCollectibleEv = eventWithType.filter(
        ev => ev.eventType === EventType.CLAIM_COLLECTIBLE,
      );

      // skip transfer event if it is sale or accept offer or flexdrop minted -> prevent duplicate event
      const eventlogs = eventWithType.filter(ev => {
        if (
          ev.eventType === EventType.TRANSFER_721 ||
          ev.eventType === EventType.TRANSFER_1155
        ) {
          return (
            !matchTakerAskEv.find(
              e =>
                e.transaction_hash === ev.transaction_hash &&
                e.returnValues.collection == ev.returnValues.contractAddress &&
                e.returnValues.tokenId == ev.returnValues.tokenId &&
                e.returnValues.seller == ev.returnValues.from,
            ) &&
            !matchTakerBidEv.find(
              e =>
                e.transaction_hash === ev.transaction_hash &&
                e.returnValues.collection == ev.returnValues.contractAddress &&
                e.returnValues.tokenId == ev.returnValues.tokenId &&
                e.returnValues.seller == ev.returnValues.from,
            ) &&
            !itemStakedEv.find(
              e =>
                e.transaction_hash === ev.transaction_hash &&
                e.returnValues.collection == ev.returnValues.contractAddress &&
                e.returnValues.tokenId == ev.returnValues.tokenId &&
                e.returnValues.owner == ev.returnValues.from,
            ) &&
            !itemUnstakedEv.find(
              e =>
                e.transaction_hash === ev.transaction_hash &&
                e.returnValues.collection == ev.returnValues.contractAddress &&
                e.returnValues.tokenId == ev.returnValues.tokenId &&
                e.returnValues.owner == ev.returnValues.to,
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
            log.returnValues.contractAddress === ev.returnValues.contractAddress
          ) {
            log.returnValues.isFlexDropMinted = true;
            log.returnValues.isWarpcastMinted = ev.returnValues.isWarpcast;
            log.returnValues.price =
              ev.returnValues.totalMintPrice / ev.returnValues.quantityMinted;
            log.returnValues.phaseId = ev.returnValues.phaseId;
          }
        });
      }

      for (const ev of claimCollectibleEv) {
        eventlogs.map(log => {
          if (
            log.eventType === EventType.MINT_721 &&
            log.returnValues.contractAddress === ev.returnValues.collectible
          ) {
            log.returnValues.isClaimCollectible = true;
          }
        });
      }

      for (const ev of claimPointEv) {
        eventlogs.map(log => {
          if (
            log.eventType === EventType.ITEM_UNSTAKED &&
            log.returnValues.owner === ev.returnValues.user
          ) {
            log.returnValues.point = ev.returnValues.point;
          }
        });
      }

      //process event
      let index = 0;
      for (const event of eventlogs) {
        event.index = index;
        let queue: Queue<LogsReturnValues> = null;
        let jobName: string = null;
        switch (event.eventType) {
          case EventType.CANCEL_ALL_ORDERS:
            queue = this.cancelAllOrdersQueue;
            jobName = ONCHAIN_JOBS.JOB_CANCEL_ALL_ORDERS;
            break;
          case EventType.CANCEL_OFFER:
            queue = this.cancelOfferQueue;
            jobName = ONCHAIN_JOBS.JOB_CANCEL_OFFER;
            break;
          case EventType.CREATOR_PAYOUT_UPDATED:
            queue = this.creatorPayoutQueue;
            jobName = ONCHAIN_JOBS.JOB_CREATOR_PAYOUT_UPDATED;
            break;
          case EventType.DEPLOY_CONTRACT:
            queue = this.deployContractQueue;
            jobName = ONCHAIN_JOBS.JOB_DEPLOY_CONTRACT;
            break;
          case EventType.TRANSFER_20:
            queue = this.erc20TransferQueue;
            jobName = ONCHAIN_JOBS.JOB_TRANSFER_20;
            break;
          case EventType.BURN_721:
            const { contractAddress: nftAddressBurned } =
              event.returnValues as ERC721OrERC20TransferReturnValue;
            const collectionBurnedInfo =
              await this.web3Service.getNFTCollectionDetail(
                nftAddressBurned,
                this.chain.rpc,
              );
            if (collectionBurnedInfo) {
              queue = this.erc721BurnQueue;
              jobName = ONCHAIN_JOBS.JOB_BURN_721;
            }
            break;
          case EventType.MINT_721:
            const { contractAddress: nftAddressMinted } =
              event.returnValues as ERC721OrERC20TransferReturnValue;
            const collectionMintedInfo =
              await this.web3Service.getNFTCollectionDetail(
                nftAddressMinted,
                this.chain.rpc,
              );
            if (collectionMintedInfo) {
              queue = this.erc721MintQueue;
              jobName = ONCHAIN_JOBS.JOB_MINT_721;
            }
            break;
          case EventType.TRANSFER_721:
            const { contractAddress: nftAddress } =
              event.returnValues as ERC721OrERC20TransferReturnValue;
            const collectionInfo =
              await this.web3Service.getNFTCollectionDetail(
                nftAddress,
                this.chain.rpc,
              );
            if (collectionInfo) {
              queue = this.erc721TransferQueue;
              jobName = ONCHAIN_JOBS.JOB_TRANSFER_721;
            }
            break;
          case EventType.BURN_1155:
            queue = this.erc1155BurnQueue;
            jobName = ONCHAIN_JOBS.JOB_BURN_1155;
            break;
          case EventType.MINT_1155:
            queue = this.erc1155MintQueue;
            jobName = ONCHAIN_JOBS.JOB_MINT_1155;
            break;
          case EventType.TRANSFER_1155:
            queue = this.erc1155TransferQueue;
            jobName = ONCHAIN_JOBS.JOB_TRANSFER_1155;
            break;
          case EventType.PAYER_UPDATED:
            queue = this.payerUpdateQueue;
            jobName = ONCHAIN_JOBS.JOB_PAYER_UPDATED;
            break;
          case EventType.PHASE_DROP_UPDATED:
            queue = this.phaseDropQueue;
            jobName = ONCHAIN_JOBS.JOB_PHASE_DROP_UPDATED;
            break;
          case EventType.TAKER_ASK:
            queue = this.takerAskQueue;
            jobName = ONCHAIN_JOBS.JOB_TAKER_ASK;
            break;
          case EventType.TAKER_BID:
            queue = this.takerBidQueue;
            jobName = ONCHAIN_JOBS.JOB_TAKER_BID;
            break;
          case EventType.UPGRADE_CONTRACT:
            queue = this.upgradeContractQueue;
            jobName = ONCHAIN_JOBS.JOB_UPGRADE_CONTRACT;
            break;
          case EventType.ITEM_STAKED:
            queue = this.itemStakedQueue;
            jobName = ONCHAIN_JOBS.JOB_ITEM_STAKED;
            break;
          case EventType.ITEM_UNSTAKED:
            queue = this.itemUnstakedQueue;
            jobName = ONCHAIN_JOBS.JOB_ITEM_UNSTAKED;
            break;
          case EventType.UPDATE_DROP:
            queue = this.updateDropQueue;
            jobName = ONCHAIN_JOBS.JOB_UPDATE_DROP;
            break;
        }

        if (queue && jobName) {
          await this.onchainQueue.add(queue, jobName, event);
        }
        index++;
      }

      tx.status = TransactionWorkerStatus.SUCCESS;
      return tx;
    } catch (error) {
      throw new Error(
        `get error when detect tx - ${tx.txHash} - error: ${error}`,
      );
    }
  }

  async getCollectionStandard(nftAddress: string) {
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: nftAddress,
    });

    if (nftCollection) {
      return nftCollection.standard;
    }

    const contractStandard = await this.web3Service.getContractStandard(
      nftAddress,
      this.chain.rpc,
    );

    return contractStandard;
  }
}
