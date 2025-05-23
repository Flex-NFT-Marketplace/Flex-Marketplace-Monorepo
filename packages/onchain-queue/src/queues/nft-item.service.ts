import {
  DropPhaseDocument,
  ChainDocument,
  DropPhases,
  Histories,
  HistoryDocument,
  HistoryType,
  MarketStatus,
  MarketType,
  NftCollectionDocument,
  ContractStandard,
  NftCollections,
  NftDocument,
  Nfts,
  NotificationDocument,
  Notifications,
  OfferDocument,
  OfferStatus,
  Offers,
  PaymentTokenDocument,
  PaymentTokens,
  PhaseType,
  SaleDocument,
  Sales,
  Staking,
  Signature,
  SignatureDocument,
  SignStatusEnum,
  NftCollectionStats,
  NftCollectionStatsDocument,
  FlexHausSet,
  FlexHausDrop,
  FlexHausSetDocument,
  FlexHausDropDocument,
  FlexHausPayment,
  FlexHausPaymentDocument,
  Users,
  UserDocument,
  FlexHausDropType,
  FlexHausSecureCollectible,
  FlexHausSecureCollectibleDocument,
} from '@app/shared/models';
import {
  CancelAllOrdersReturnValue,
  CancelOrderReturnValue,
  ContractDeployedReturnValue,
  CreatorPayoutUpdatedReturnValue,
  ERC1155TransferReturnValue,
  ERC721OrERC20TransferReturnValue,
  ItemStakedReturnValue,
  ItemUnStakedReturnValue,
  PayerUpdatedReturnValue,
  PhaseDropUpdatedReturnValue,
  SaleReturnValue,
  UpdateDropReturnValue,
  UpgradedContractReturnValue,
} from '@app/web3-service/decodeEvent';
import { EventType, LogsReturnValues } from '@app/web3-service/types';
import { Web3Service } from '@app/web3-service/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../users/user.service';
import template from '../notifications/template';
import { formattedContractAddress } from '@app/shared/utils';
import { InjectQueue } from '@nestjs/bull';
import {
  JOB_QUEUE_COLLECTIBLE_BASE_URI,
  JOB_QUEUE_NFT_METADATA,
  QUEUE_BASE_URI,
  QUEUE_METADATA,
} from '@app/shared/types';
import { Queue } from 'bull';

@Injectable()
export class NftItemService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    @InjectModel(PaymentTokens.name)
    private readonly paymentTokenModel: Model<PaymentTokenDocument>,
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
    @InjectModel(Histories.name)
    private readonly historyModel: Model<HistoryDocument>,
    @InjectModel(Sales.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(Offers.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(DropPhases.name)
    private readonly dropPhaseModel: Model<DropPhaseDocument>,
    @InjectModel(Staking.name)
    private readonly stakingModel: Model<Staking>,
    @InjectModel(Signature.name)
    private readonly signatureModel: Model<SignatureDocument>,
    @InjectModel(NftCollectionStats.name)
    private readonly nftCollectionStats: Model<NftCollectionStatsDocument>,
    @InjectModel(FlexHausSet.name)
    private readonly flexHausSetModel: Model<FlexHausSetDocument>,
    @InjectModel(FlexHausDrop.name)
    private readonly flexHausDropModel: Model<FlexHausDropDocument>,
    @InjectQueue(QUEUE_METADATA)
    private readonly fetchMetadataQueue: Queue<string>,
    @InjectQueue(QUEUE_BASE_URI)
    private readonly fetchCollectibleBaseUriQueue: Queue<string>,
    @InjectModel(FlexHausPayment.name)
    private readonly flexHausPaymentModel: Model<FlexHausPaymentDocument>,
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(FlexHausSecureCollectible.name)
    private readonly flexHausSecureCollectibleModel: Model<FlexHausSecureCollectibleDocument>,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
  ) {}

  logger = new Logger(NftItemService.name);

  async processEvent(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const process: any = {};
    process[EventType.DEPLOY_CONTRACT] = this.processContractDeployed;
    process[EventType.UPGRADE_CONTRACT] = this.processUpgradedContract;
    process[EventType.MINT_721] = this.processNft721Minted;
    process[EventType.BURN_721] = this.processNft721Burned;
    process[EventType.TRANSFER_721] = this.processNft721Transfered;
    process[EventType.MINT_1155] = this.processNft1155Minted;
    process[EventType.BURN_1155] = this.processNft1155Burned;
    process[EventType.TRANSFER_1155] = this.processNft1155Transfered;
    process[EventType.CANCEL_OFFER] = this.processCancelOrder;
    process[EventType.CANCEL_ALL_ORDERS] = this.processCancelAllOrders;
    process[EventType.TAKER_BID] = this.processTakerBid;
    process[EventType.TAKER_ASK] = this.processTakerAsk;
    process[EventType.PHASE_DROP_UPDATED] = this.processPhaseDropUpdated;
    process[EventType.CREATOR_PAYOUT_UPDATED] =
      this.processCreatorPayoutUpdated;
    process[EventType.PAYER_UPDATED] = this.processPayerUpdated;
    process[EventType.UPDATE_METADATA_721] = this.processNft721UpdateMetadata;
    process[EventType.UPDATE_METADATA_1155] = this.processNft1155UpdateMetadata;
    process[EventType.ITEM_STAKED] = this.processItemStaked;
    process[EventType.ITEM_UNSTAKED] = this.processItemUnstaked;
    process[EventType.UPDATE_DROP] = this.processUpdateDrop;
    process[EventType.TRANSFER_20] = this.processErc20Transfered;

    await process[log.eventType].call(this, log, chain, index);
  }

  async getOrCreateNftCollection(
    nftAddress: string,
    chain: ChainDocument,
  ): Promise<NftCollectionDocument> {
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: nftAddress,
    });

    if (nftCollection) {
      return nftCollection;
    }

    const collectionInfo = await this.web3Service.getNFTCollectionDetail(
      nftAddress,
      chain.rpc,
    );
    if (!collectionInfo) {
      return null;
    }

    const { name, standard, symbol, isNonFungibleFlexDropToken, contractUri } =
      collectionInfo;
    const paymentTokens = await this.paymentTokenModel.find({
      isNative: true,
    });
    const nftCollectionEntity: NftCollections = {
      name,
      symbol,
      key: nftAddress,
      nftContract: nftAddress,
      owner: null,
      chain,
      standard,
      paymentTokens,
      collaboratories: [],
      isNonFungibleFlexDropToken,
      contractUri,
      dropPhases: [],
      attributesMap: [],
    };

    const nftCollectionDocument =
      await this.nftCollectionModel.findOneAndUpdate(
        {
          nftContract: nftCollectionEntity.nftContract,
        },
        { $set: nftCollectionEntity },
        { upsert: true, new: true },
      );
    return nftCollectionDocument;
  }
  async getOrCreateNftCollectionStats(nftAddress: string) {
    const nftCollectionStats = await this.nftCollectionStats.findOne({
      nftContract: nftAddress,
    });

    if (nftCollectionStats) {
      return nftCollectionStats;
    }

    const nftCollectionStatsEntity: NftCollectionStats = {
      nftContract: nftAddress,
      bestOffer: 0,
      nftCount: 0,
      ownerCount: 0,
      totalVolume: 0,
      totalListingCount: 0,
      floorPrice: 0,
      stats1D: {
        saleCount: 0,
        volume: 0,
        avgPrice: 0,
        volChange: 0,
      },
      stats7D: {
        saleCount: 0,
        volume: 0,
        avgPrice: 0,
        volChange: 0,
      },
      lastUpdated: 0,
    };

    const nftCollectionStatsDocument =
      await this.nftCollectionModel.findOneAndUpdate(
        {
          nftContract: nftCollectionStatsEntity.nftContract,
        },
        { $set: nftCollectionStatsEntity },
        { upsert: true, new: true },
      );
    return nftCollectionStatsDocument;
  }
  async processContractDeployed(log: LogsReturnValues, chain: ChainDocument) {
    const { address, deployer, isFlexHausCollectible } =
      log.returnValues as ContractDeployedReturnValue;

    const nftInfo = await this.web3Service.getNFTCollectionDetail(
      address,
      chain.rpc,
    );

    if (nftInfo) {
      this.logger.log(`New NFT Collection found at address: ${address}`);

      const {
        name,
        symbol,
        standard,
        isNonFungibleFlexDropToken,
        contractUri,
      } = nftInfo;

      const paymentTokens = await this.paymentTokenModel.find({
        chain: chain,
        isNative: true,
      });

      const ownerDocument = await this.userService.getOrCreateUser(deployer);

      const nftCollectionEntity: NftCollections = {
        name,
        symbol,
        key: address,
        nftContract: address,
        owner: ownerDocument,
        chain,
        standard,
        paymentTokens: paymentTokens,
        collaboratories: [],
        isNonFungibleFlexDropToken,
        contractUri,
        isFlexHausCollectible,
        dropAmount: log.returnValues.drop_amount
          ? Number(log.returnValues.drop_amount)
          : null,
        rarity: log.returnValues.rarity ? log.returnValues.rarity : null,
        dropPhases: [],
        attributesMap: [],
      };

      const nftCollection = await this.nftCollectionModel.findOneAndUpdate(
        {
          chain,
          nftContract: address,
        },
        {
          $set: nftCollectionEntity,
        },
        {
          new: true,
          upsert: true,
        },
      );

      this.logger.debug(`create collection ${nftCollection._id}`);
      if (isFlexHausCollectible) {
        this.fetchCollectibleBaseUriQueue.add(
          JOB_QUEUE_COLLECTIBLE_BASE_URI,
          nftCollection._id,
        );
      }
    }
  }

  async processUpgradedContract(log: LogsReturnValues, chain: ChainDocument) {
    const { nftAddress } = log.returnValues as UpgradedContractReturnValue;

    const nftInfo = await this.web3Service.getNFTCollectionDetail(
      nftAddress,
      chain.rpc,
    );

    if (nftInfo) {
      this.logger.log(`New NFT Collection found at address: ${nftAddress}`);
      const {
        name,
        symbol,
        standard,
        isNonFungibleFlexDropToken,
        contractUri,
      } = nftInfo;

      const paymentTokens = await this.paymentTokenModel.find({
        chain: chain,
        isNative: true,
      });

      const nftCollectionEntity: NftCollections = {
        name,
        symbol,
        nftContract: nftAddress,
        chain,
        standard,
        paymentTokens: paymentTokens,
        isNonFungibleFlexDropToken,
        contractUri,
      };

      const nftCollection = await this.nftCollectionModel.findOneAndUpdate(
        {
          chain,
          nftContract: nftAddress,
        },
        {
          $set: nftCollectionEntity,
        },
        {
          new: true,
          upsert: true,
        },
      );

      this.logger.debug(`update collection ${nftCollection._id}`);
    }
  }

  async processErc20Transfered(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const { contractAddress, to, value, timestamp } =
      log.returnValues as ERC721OrERC20TransferReturnValue;
    const checkHistory = await this.historyModel.findOne({
      txHash: log.transaction_hash,
      index,
    });

    if (checkHistory) {
      return;
    }
    const now = Date.now();

    const flexhausPaymentAccount = await this.flexHausPaymentModel.findOne(
      {
        address: to,
        deadline: { $gt: now },
      },
      { _id: 1, address: 1, user: 1, deadline: 1 },
    );

    if (!flexhausPaymentAccount) {
      return;
    }

    const paymentToken = await this.paymentTokenModel.findOne({
      contractAddress: contractAddress,
      isPointPaymentToken: true,
    });

    if (!paymentToken) {
      return;
    }

    const user = await this.userModel.findById(flexhausPaymentAccount.user);

    const point =
      paymentToken.symbol === 'STRK'
        ? Math.floor(Number(value) / Number(chain.strkPerPoint))
        : Math.floor(Number(value) / Number(chain.ethPerPoint));

    user.points += point;
    await user.save();

    const history: Histories = {
      nft: null,
      tokenId: null,
      nftContract: null,
      nftCollection: null,
      from: null,
      to: flexhausPaymentAccount.user,
      amount: point,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.BuyPoint,
    };

    await this.historyModel.findOneAndUpdate(
      {
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true },
    );
  }

  async processNft721Minted(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      value: tokenId,
      contractAddress: nftAddress,
      timestamp,
      price,
      isFlexDropMinted,
      isWarpcastMinted,
      isClaimCollectible,
      phaseId,
    } = log.returnValues as ERC721OrERC20TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    if (!nftCollection) return;

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const existedNft = await this.nftModel.findOne({
      nftContract: nftAddress,
      tokenId,
    });
    let nftDocument: NftDocument = null;

    if (existedNft) {
      existedNft.creator = toUser;
      await existedNft.save();
      nftDocument = existedNft;
    } else {
      const newNftEntity: Nfts = {
        tokenId,
        nftContract: nftAddress,
        nftCollection: nftCollection._id,
        chain,
        royaltyRate: 0,
        creator: toUser,
        owner: toUser,
        amount: 1,
        marketType: MarketType.NotForSale,
        blockTime: timestamp,
      };

      nftDocument = await this.nftModel.findOneAndUpdate(
        {
          nftContract: nftAddress,
          tokenId,
          burnedAt: null,
        },
        { $set: newNftEntity },
        { new: true, upsert: true },
      );
    }

    if (isClaimCollectible) {
      await this.flexHausSecureCollectibleModel.findOneAndUpdate(
        {
          user: toUser._id,
          collectible: nftCollection._id,
        },
        { $set: { isClaimed: true } },
        { upsert: true, new: true },
      );
    }

    const history: Histories = {
      nft: nftDocument,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: 1,
      price: price ? price : 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: isFlexDropMinted
        ? HistoryType.FlexDropMint
        : isWarpcastMinted
          ? HistoryType.WarpcastMint
          : isClaimCollectible
            ? HistoryType.ClaimCollectible
            : HistoryType.Mint,
      phaseId: phaseId ? phaseId : null,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );

    this.logger.debug(
      `nft minted ${nftAddress}: ${tokenId} ${from} -> ${to} - ${timestamp}`,
    );

    await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, nftDocument._id);
  }

  async processNft721UpdateMetadata(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      tokenId,
      nftAddress,
      timestamp,
      price,
      isFlexDropMinted,
    } = log.returnValues as any;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    if (!nftCollection) return;

    const toUser = await this.userService.getOrCreateUser(to);

    const existedNft = await this.nftModel.findOne(
      {
        nftContract: nftAddress,
        $or: [{ tokenId: Number(tokenId) }, { tokenId: tokenId }],
      },
      { tokenUri: 0 },
    );
    let nftDocument: NftDocument = null;

    const owner = await this.web3Service.getERC721Owner(
      nftAddress,
      tokenId,
      chain.rpc,
    );
    const ownerDocument = owner
      ? await this.userService.getOrCreateUser(owner)
      : null;
    if (existedNft) {
      existedNft.creator = toUser;
      existedNft.tokenId = tokenId;
      existedNft.owner = ownerDocument;
      existedNft.isBurned = ownerDocument ? false : true;
      await existedNft.save();
      nftDocument = existedNft;
    } else {
      const newNftEntity: Nfts = {
        tokenId,
        nftContract: nftAddress,
        nftCollection: nftCollection._id,
        chain,
        royaltyRate: 0,
        creator: toUser,
        owner: ownerDocument,
        amount: 1,
        marketType: MarketType.NotForSale,
        blockTime: timestamp,
        isBurned: ownerDocument ? false : true,
      };

      nftDocument = await this.nftModel.findOneAndUpdate(
        {
          nftContract: nftAddress,
          tokenId,
        },
        { $set: newNftEntity },
        { new: true, upsert: true },
      );
    }

    await this.historyModel.updateMany(
      {
        nftContract: nftAddress,
        tokenId: Number(tokenId),
      },
      {
        $set: {
          tokenId,
        },
      },
    );

    this.logger.debug(
      `nft update metadata ${nftAddress}: ${String(tokenId)} ${timestamp}`,
    );

    await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, nftDocument._id);
  }

  async processNft721Burned(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      value: tokenId,
      contractAddress: nftAddress,
      timestamp,
    } = log.returnValues as ERC721OrERC20TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,

      chain,
    );

    if (!nftCollection) return;

    const nft = await this.nftModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        burnedAt: null,
      },
      {
        $set: {
          burnedAt: timestamp,
          isBurned: true,
          blockTime: timestamp,
          sale: null,
          marketType: MarketType.NotForSale,
        },
      },
      { new: true, upsert: true },
    );

    const availableSale = await this.saleModel.findOne({
      nft,
      status: MarketStatus.OnSale,
    });

    if (availableSale) {
      await this.saleModel.findOneAndUpdate(
        { _id: availableSale._id },
        { $set: { status: MarketStatus.Cancelled } },
      );
    }

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const history: Histories = {
      nft,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: 1,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.Burn,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );

    await this.signatureModel.findOneAndUpdate(
      {
        contract_address: nftAddress,
        token_id: tokenId,
      },
      {
        $set: {
          is_burned: true,
          is_burned_tx_hash: log.transaction_hash,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    this.logger.debug(`nft burned ${nftAddress}: ${tokenId} at - ${timestamp}`);
  }

  async processNft721Transfered(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      value: tokenId,
      contractAddress: nftAddress,
      timestamp,
    } = log.returnValues as ERC721OrERC20TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    if (!nftCollection) return;

    const nft = await this.nftModel.findOne({
      nftContract: nftAddress,
      tokenId,
    });

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const updateNfts = [];
    const newNfts: Nfts[] = [];
    if (nft) {
      const updateNft = {
        blockTime: timestamp,
        owner: toUser,
        sale: null,
        marketType: MarketType.NotForSale,
      };
      updateNfts.push({
        updateOne: {
          filter: {
            blockTime: { $lte: timestamp },
            _id: nft._id,
          },
          update: { $set: updateNft },
        },
      });

      const availableSale = await this.saleModel.findOne({
        nft,
        status: MarketStatus.OnSale,
      });

      if (availableSale) {
        await this.saleModel.findOneAndUpdate(
          { _id: availableSale._id },
          { $set: { status: MarketStatus.Cancelled } },
        );
      }
    } else {
      newNfts.push({
        tokenId,
        nftContract: nftAddress,
        nftCollection,
        chain: chain,
        blockTime: timestamp,
        royaltyRate: 0,
        creator: fromUser,
        owner: toUser,
        amount: 1,
        marketType: MarketType.NotForSale,
      });
    }

    const history: Histories = {
      nft,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: 1,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.Transfer,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );

    await this.signatureModel.findOneAndUpdate(
      {
        contract_address: nftAddress,
        token_id: tokenId,
      },
      {
        $set: {
          status: SignStatusEnum.SOLD,
          transaction_hash: log.transaction_hash,
          buyer_address: to,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    if (updateNfts.length > 0) {
      await this.nftModel.bulkWrite(updateNfts);
    }

    if (newNfts.length > 0) {
      await this.nftModel.insertMany(newNfts);
    }

    this.logger.debug(
      `nft transfer ${nftAddress}: ${tokenId} from ${from} -> ${to} at - ${timestamp}`,
    );
  }

  async processNft1155UpdateMetadata(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      tokenId,
      contractAddress: nftAddress,
      timestamp,
      value,
    } = log.returnValues as ERC1155TransferReturnValue;

    const nftDocuments = await this.nftModel.find(
      {
        $or: [{ tokenId: Number(tokenId) }, { tokenId: tokenId }],
        nftContract: nftAddress,
      },
      { tokenUri: 0 },
    );

    for (const document of nftDocuments) {
      document.tokenId = tokenId;
      await document.save();
      await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, document._id);
    }

    await this.historyModel.updateMany(
      {
        nftContract: nftAddress,
        tokenId: Number(tokenId),
      },
      {
        $set: {
          tokenId,
        },
      },
    );
    this.logger.debug(`nft update metadata ${nftAddress}: ${tokenId}`);
  }

  async processNft1155Minted(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      tokenId,
      contractAddress: nftAddress,
      timestamp,
      value,
    } = log.returnValues as ERC1155TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,

      chain,
    );

    if (!nftCollection) return;

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const existedNft = await this.nftModel.findOne({
      tokenId,
      nftContract: nftAddress,
      owner: toUser,
    });

    let amount = value;
    if (existedNft) {
      amount += existedNft.amount;
    }

    const newNftEntity: Nfts = {
      tokenId,
      nftContract: nftAddress,
      nftCollection: nftCollection._id,
      chain,
      royaltyRate: 0,
      creator: toUser,
      owner: toUser,
      amount,
      marketType: MarketType.NotForSale,
      blockTime: timestamp,
    };

    const nftDocument = await this.nftModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        owner: toUser,
      },
      { $set: newNftEntity },
      { new: true, upsert: true },
    );

    const history: Histories = {
      nft: nftDocument,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: value,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.Mint,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );

    this.logger.debug(
      `${value} nft minted ${nftAddress}: ${tokenId} ${from} -> ${to} - ${timestamp}`,
    );

    await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, nftDocument._id);
  }

  async processNft1155Burned(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      tokenId,
      contractAddress: nftAddress,
      timestamp,
      value,
    } = log.returnValues as ERC1155TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,

      chain,
    );

    if (!nftCollection) return;

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const existedNft = await this.nftModel.findOne({
      tokenId,
      nftContract: nftAddress,
      owner: toUser,
    });

    let nftDocument: NftDocument;
    if (existedNft) {
      const newAmount = existedNft.amount - value;

      const newSale = await this.updateSaleRemainningAmount(
        existedNft.sale,
        value,
        newAmount,
      );

      let marketType = MarketType.NotForSale;
      if (newSale && newSale.status === MarketStatus.OnSale) {
        marketType = MarketType.OnSale;
      }

      nftDocument = await this.nftModel.findOneAndUpdate(
        {
          nftContract: nftAddress,
          tokenId,
        },
        {
          $set: {
            amount: newAmount <= 0 ? 0 : newAmount,
            burnedAt: timestamp,
            isBurned: newAmount <= 0 ? true : false,
            blockTime: timestamp,
            marketType,
            sales: marketType == MarketType.OnSale ? newSale : null,
          },
        },
        { new: true, upsert: true },
      );
    }

    const history: Histories = {
      nft: nftDocument,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: value,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.Burn,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );
    await this.signatureModel.findOneAndUpdate(
      {
        contract_address: nftAddress,
        token_id: tokenId,
      },
      {
        $set: {
          is_burned: true,
          is_burned_tx_hash: log.transaction_hash,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
    this.logger.debug(
      `${value} nft burned ${nftAddress}: ${tokenId} ${from} -> ${to} - ${timestamp}`,
    );
  }

  async processNft1155Transfered(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      from,
      to,
      tokenId,
      contractAddress: nftAddress,
      timestamp,
      value,
    } = log.returnValues as ERC1155TransferReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    if (!nftCollection) return;

    const fromUser = await this.userService.getOrCreateUser(from);
    const toUser = await this.userService.getOrCreateUser(to);

    const fromBalance = await this.nftModel
      .findOne({
        nftContract: nftAddress,
        tokenId,
        owner: fromUser,
        isBurned: false,
      })
      .populate(['sale']);

    const toBalance = await this.nftModel
      .findOne({
        nftContract: nftAddress,
        tokenId,
        owner: toUser,
        isBurned: false,
      })
      .populate(['sale']);

    const updateNfts = [];
    const newNfts: Nfts[] = [];
    if (fromBalance) {
      const newFromAmount = fromBalance.amount - value;

      // cancel some sale if from user has amount less than listed amount
      let marketType = MarketType.NotForSale;
      const newSale = await this.updateSaleRemainningAmount(
        fromBalance.sale,
        value,
        newFromAmount,
      );

      if (newSale && newSale.status === MarketStatus.OnSale) {
        marketType = MarketType.OnSale;
      }

      const updateNft = {
        blockTime: timestamp,
        marketType,
        amount: newFromAmount <= 0 ? 0 : newFromAmount,
        sales: marketType == MarketType.OnSale ? newSale : null,
      };
      updateNfts.push({
        updateOne: {
          filter: {
            _id: fromBalance._id,
          },
          update: { $set: updateNft },
        },
      });
    }

    let toAmount = value;
    if (toBalance) {
      toAmount += toBalance.amount;
      const updateNft = {
        blockTime: timestamp,
        amount: toAmount,
      };
      updateNfts.push({
        updateOne: {
          filter: {
            _id: toBalance._id,
          },
          update: { $set: updateNft },
        },
      });
    } else {
      newNfts.push({
        tokenId,
        nftContract: nftAddress,
        nftCollection,
        chain,
        blockTime: timestamp,
        royaltyRate: 0,
        creator: fromUser,
        owner: toUser,
        amount: value,
        marketType: MarketType.NotForSale,
      });
    }

    const history: Histories = {
      nft: fromBalance,
      tokenId,
      nftContract: nftAddress,
      nftCollection,
      from: fromUser,
      to: toUser,
      amount: value,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: HistoryType.Transfer,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: nftAddress,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );

    await this.signatureModel.findOneAndUpdate(
      {
        contract_address: nftAddress,
        token_id: tokenId,
      },
      {
        $set: {
          status: SignStatusEnum.SOLD,
          transaction_hash: log.transaction_hash,
          buyer_address: to,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    if (newNfts.length > 0) {
      await this.nftModel.insertMany(newNfts);
    }

    if (updateNfts.length > 0) {
      await this.nftModel.bulkWrite(updateNfts);
    }

    this.logger.debug(
      `${value} nft transfers ${nftAddress}: ${tokenId} ${from} -> ${to} - ${timestamp}`,
    );
  }

  async updateSaleRemainningAmount(
    sale: SaleDocument,
    valueTransfered: number,
    userBalance: number,
  ): Promise<SaleDocument> {
    if (!sale) return null;

    const newSale = sale;
    if (sale.remainingAmount > userBalance) {
      const checkRemainningValue = sale.remainingAmount - valueTransfered;

      if (checkRemainningValue > 0) {
        newSale.remainingAmount = sale.remainingAmount - valueTransfered;
        newSale.price =
          (sale.price / sale.amount) * (sale.remainingAmount - valueTransfered);
      } else {
        newSale.remainingAmount = 0;
        newSale.status = MarketStatus.Cancelled;
      }

      await this.saleModel.findOneAndUpdate(
        { _id: sale._id },
        { $set: newSale },
      );
    }

    return newSale;
  }

  async processCancelOrder(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const { user, orderNonce, timestamp } =
      log.returnValues as CancelOrderReturnValue;

    const userDocument = await this.userService.getOrCreateUser(user);
    const availableSale = await this.saleModel.findOne({
      signer: userDocument,
      saltNonce: orderNonce,
    });

    let newNftDocument: NftDocument = null;
    let historyType: HistoryType = HistoryType.CancelSale;

    if (availableSale) {
      await this.saleModel.findOneAndUpdate(
        { _id: availableSale._id },
        { $set: { status: MarketStatus.Cancelled } },
      );

      newNftDocument = await this.nftModel.findOneAndUpdate(
        { _id: availableSale.nft._id },
        {
          $set: {
            sale: null,
            marketType: MarketType.NotForSale,
          },
        },
        { new: true },
      );

      historyType = HistoryType.CancelSale;
    }
    const offerDocument = await this.offerModel.findOne({
      buyer: userDocument,
      saltNonce: orderNonce,
    });

    if (offerDocument) {
      await this.offerModel.findOneAndUpdate(
        { _id: offerDocument._id },
        { $set: { status: OfferStatus.Cancelled } },
      );

      newNftDocument = await this.nftModel.findOne({
        _id: offerDocument.nft._id,
      });

      historyType = HistoryType.CancelOffer;
    }

    const history: Histories = {
      nft: newNftDocument,
      tokenId: newNftDocument ? newNftDocument.tokenId : null,
      nftContract: newNftDocument ? newNftDocument.nftContract : null,
      nftCollection: newNftDocument ? newNftDocument.nftCollection : null,
      from: userDocument,
      amount: 0,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp,
      chain,
      type: historyType,
      sale: availableSale ? availableSale : null,
      offer: offerDocument ? offerDocument : null,
    };

    await this.historyModel.findOneAndUpdate(
      {
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );
  }

  async processCancelAllOrders(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const { user, newMinNonce, timestamp } =
      log.returnValues as CancelAllOrdersReturnValue;

    const userDocument = await this.userService.getOrCreateUser(user);
    const availableSales = await this.saleModel.find({
      signer: userDocument,
      saltNonce: { $lt: newMinNonce },
      status: MarketStatus.OnSale,
    });

    const updateNfts = [];
    const updateHistories = [];
    const updateSales = [];
    const updateOffers = [];
    if (availableSales.length > 0) {
      for (const sale of availableSales) {
        updateSales.push({
          updateOne: {
            filter: {
              _id: sale._id,
            },
            update: {
              status: MarketStatus.Cancelled,
            },
          },
        });

        updateNfts.push({
          updateOne: {
            filter: {
              _id: sale.nft._id,
            },
            update: {
              sale: null,
              marketType: MarketType.NotForSale,
            },
          },
        });

        const history: Histories = {
          nft: sale.nft,
          tokenId: sale.nft.tokenId,
          nftContract: sale.nft.nftContract,
          nftCollection: sale.nft.nftCollection,
          from: userDocument,
          amount: 0,
          price: 0,
          priceInUsd: 0,
          txHash: log.transaction_hash,
          index,
          timestamp,
          chain,
          type: HistoryType.CancelSale,
          sale: sale,
        };

        updateHistories.push({
          updateOne: {
            filter: {
              nft: history.nft,
              txHash: history.txHash,
              index: history.index,
              sale: history.sale,
            },
            update: history,
            upsert: true,
          },
        });
      }
    }
    const offerDocuments = await this.offerModel.find({
      buyer: userDocument,
      saltNonce: { $lt: newMinNonce },
      status: OfferStatus.Pending,
    });

    if (offerDocuments.length > 0) {
      for (const offer of offerDocuments) {
        updateOffers.push({
          updateOne: {
            filter: {
              _id: offer._id,
            },
            update: {
              status: OfferStatus.Cancelled,
            },
          },
        });

        const history: Histories = {
          nft: offer.nft,
          tokenId: offer.nft.tokenId,
          nftContract: offer.nft.nftContract,
          nftCollection: offer.nft.nftCollection,
          from: userDocument,
          amount: 0,
          price: 0,
          priceInUsd: 0,
          txHash: log.transaction_hash,
          index,
          timestamp,
          chain,
          type: HistoryType.CancelOffer,
          offer,
        };
        updateHistories.push({
          updateOne: {
            filter: {
              nft: history.nft,
              txHash: history.txHash,
              index: history.index,
              offer: history.offer,
            },
            update: history,
            upsert: true,
          },
        });
      }
    }

    if (updateSales.length > 0) {
      await this.saleModel.bulkWrite(updateSales);
    }

    if (updateOffers.length > 0) {
      await this.offerModel.bulkWrite(updateOffers);
    }

    if (updateNfts.length > 0) {
      await this.nftModel.bulkWrite(updateNfts);
    }

    if (updateHistories.length > 0) {
      await this.historyModel.bulkWrite(updateHistories);
    }
  }

  async processTakerBid(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      seller,
      buyer,
      currency,
      collection,
      tokenId,
      amount,
      price,
      timestamp,
    } = log.returnValues as SaleReturnValue;

    const orderNonce = log.returnValues.orderNonce;

    const nftCollection = await this.getOrCreateNftCollection(
      collection,
      chain,
    );

    if (!nftCollection) return;

    const paymentToken = await this.paymentTokenModel.findOne({
      contractAddress: currency,
    });
    const sellerUser = await this.userService.getOrCreateUser(seller);
    const buyerUser = await this.userService.getOrCreateUser(buyer);

    const sellerNft = await this.nftModel.findOne({
      tokenId,
      nftContract: collection,
      owner: sellerUser,
    });

    const sale = orderNonce
      ? await this.saleModel.findOne({
          signer: sellerUser,
          saltNonce: orderNonce,
        })
      : null;

    await this.offerModel.updateMany(
      { seller: sellerUser, status: OfferStatus.Pending },
      { $set: { status: OfferStatus.Cancelled } },
    );

    if (sellerNft) {
      const history: Histories = {
        nft: sellerNft,
        tokenId,
        nftContract: collection,
        nftCollection,
        from: sellerUser,
        to: buyerUser,
        amount,
        price,
        priceInUsd: 0,
        txHash: log.transaction_hash,
        index,
        timestamp,
        chain,
        type: HistoryType.Sale,
        paymentToken,
        sale,
      };

      await this.historyModel.findOneAndUpdate(
        {
          nftContract: collection,
          tokenId,
          txHash: log.transaction_hash,
          index,
        },
        { $set: history },
        { upsert: true, new: true },
      );

      const notification: Notifications = {
        nft: sellerNft,
        content: template.sold({
          name: sellerNft.name || `#${sellerNft.tokenId}`,
          amount: price,
          tokenSymbol: paymentToken.symbol.toUpperCase(),
        }),
        user: sellerUser,
        txHash: log.transaction_hash,
        index,
      };

      await this.notificationModel.findOneAndUpdate(
        {
          nft: sellerNft,
          txHash: log.transaction_hash,
          index,
        },
        {
          $set: notification,
        },
        {
          upsert: true,
        },
      );
    }

    const updateNftItems = [];
    const updateSale = [];
    if (nftCollection.standard === ContractStandard.ERC721) {
      if (sellerNft) {
        updateNftItems.push({
          updateOne: {
            filter: {
              _id: sellerNft._id,
              $or: [
                { blockTime: { $lte: timestamp } },
                {
                  blockTime: null,
                },
              ],
            },
            update: {
              sale: null,
              price: 0,
              owner: buyerUser,
              blockTime: timestamp,
              marketType: MarketType.NotForSale,
            },
          },
        });
      }

      if (sale) {
        updateSale.push({
          updateOne: {
            filter: {
              _id: sale._id,
            },
            update: {
              remainingAmount: 0,
              status: MarketStatus.Sold,
            },
          },
        });
      }
    } else {
      try {
        const counterSignatureUsage = orderNonce
          ? await this.web3Service.getCounterUsageSignature(
              seller,
              orderNonce,
              chain,
            )
          : null;

        const remainingUsage =
          sale && counterSignatureUsage
            ? sale.amount - counterSignatureUsage
            : 0;

        if (sellerNft.blockTime <= timestamp) {
          sellerNft.amount -= amount;
          sellerNft.blockTime = timestamp;
          if (remainingUsage == 0) {
            sellerNft.sale = null;
          }

          updateNftItems.push({
            updateOne: {
              filter: {
                tokenId,
                nftContract: collection,
                owner: sellerUser,
              },
              update: { $set: sellerNft },
            },
          });
        }

        const buyerNft = await this.nftModel.findOne({
          tokenId,
          nftContract: collection,
          owner: buyerUser,
        });
        if (buyerNft) {
          if (buyerNft.blockTime <= timestamp) {
            buyerNft.amount += amount;
            buyerNft.blockTime = timestamp;

            updateNftItems.push({
              updateOne: {
                filter: {
                  _id: buyerNft._id,
                },
                update: { $set: buyerNft },
              },
            });
          }
        } else {
          const newBuyerNft: Nfts = {
            tokenId,
            nftContract: collection,
            nftCollection,
            chain,
            blockTime: timestamp,
            royaltyRate: 0,
            creator: buyerNft.creator,
            owner: buyerUser,
            amount,
            marketType: MarketType.NotForSale,
          };
          updateNftItems.push({ insertOne: newBuyerNft });
        }

        if (sale) {
          updateSale.push({
            updateOne: {
              filter: {
                _id: sale._id,
              },
              update: {
                $set:
                  remainingUsage == 0
                    ? {
                        remainingAmount: remainingUsage,
                        status: MarketStatus.Sold,
                      }
                    : {
                        remainingAmount: remainingUsage,
                      },
              },
            },
          });
        }
      } catch (error) {}
    }

    if (updateNftItems.length > 0) {
      await this.nftModel.bulkWrite(updateNftItems);
    }

    if (updateSale.length > 0) {
      await this.saleModel.bulkWrite(updateSale);
    }
  }

  async processTakerAsk(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const {
      seller,
      buyer,
      currency,
      collection,
      tokenId,
      amount,
      price,
      timestamp,
    } = log.returnValues as SaleReturnValue;
    const orderNonce = log.returnValues.orderNonce;

    const nftCollection = await this.getOrCreateNftCollection(
      collection,
      chain,
    );

    if (!nftCollection) return;

    const paymentToken = await this.paymentTokenModel.findOne({
      contractAddress: currency,
    });
    const sellerUser = await this.userService.getOrCreateUser(seller);
    const buyerUser = await this.userService.getOrCreateUser(buyer);

    const sellerNft = await this.nftModel.findOne({
      tokenId,
      nftContract: collection,
      owner: sellerUser,
    });

    const offer = orderNonce
      ? await this.offerModel.findOne({
          signer: buyerUser,
          saltNonce: orderNonce,
        })
      : null;

    if (sellerNft) {
      const history: Histories = {
        nft: sellerNft,
        tokenId,
        nftContract: collection,
        nftCollection,
        from: sellerUser,
        to: buyerUser,
        amount,
        price,
        priceInUsd: 0,
        txHash: log.transaction_hash,
        index,
        timestamp,
        chain,
        type: HistoryType.Sale,
        paymentToken,
      };

      await this.historyModel.findOneAndUpdate(
        {
          nftContract: collection,
          tokenId,
          txHash: log.transaction_hash,
          index,
        },
        { $set: history },
        { upsert: true, new: true },
      );

      const notification: Notifications = {
        nft: sellerNft,
        content: template.offerAccepted({
          name: sellerNft.name || `#${sellerNft.tokenId}`,
          amount: price,
          tokenSymbol: paymentToken.symbol.toUpperCase(),
        }),
        user: sellerUser,
        txHash: log.transaction_hash,
        index,
      };

      await this.notificationModel.findOneAndUpdate(
        {
          nft: sellerNft,
          txHash: log.transaction_hash,
          index,
        },
        {
          $set: notification,
        },
        {
          upsert: true,
        },
      );
    }

    const updateNftItems = [];
    const updateOffer = [];
    if (nftCollection.standard === ContractStandard.ERC721) {
      if (sellerNft) {
        updateNftItems.push({
          updateOne: {
            filter: {
              _id: sellerNft._id,
              $or: [
                { blockTime: { $lte: timestamp } },
                {
                  blockTime: null,
                },
              ],
            },
            update: {
              sale: null,
              price: 0,
              owner: buyerUser,
              blockTime: timestamp,
              marketType: MarketType.NotForSale,
            },
          },
        });
      }

      if (offer) {
        updateOffer.push({
          updateOne: {
            filter: {
              _id: offer._id,
            },
            update: {
              remainingAmount: 0,
              status: OfferStatus.Accepted,
            },
          },
        });

        await this.offerModel.updateMany(
          { _id: { $ne: offer._id }, status: OfferStatus.Pending },
          { $set: { status: OfferStatus.Cancelled } },
        );
      }

      if (sellerNft) {
        await this.saleModel.findOneAndUpdate(
          { nft: sellerNft._id, status: MarketStatus.OnSale },
          { $set: { status: MarketStatus.Cancelled } },
        );
      }
    } else {
      try {
        const counterSignatureUsage = orderNonce
          ? await this.web3Service.getCounterUsageSignature(
              buyer,
              orderNonce,
              chain,
            )
          : null;

        const remainingUsage =
          offer && counterSignatureUsage
            ? offer.amount - counterSignatureUsage
            : 0;

        if (sellerNft.blockTime <= timestamp) {
          sellerNft.amount -= amount;
          sellerNft.blockTime = timestamp;
          const availableSale = await this.saleModel.findOne({
            signer: sellerUser,
            saltNonce: orderNonce,
            status: MarketStatus.OnSale,
          });

          if (
            availableSale &&
            availableSale.remainingAmount > sellerNft.amount
          ) {
            availableSale.remainingAmount = sellerNft.amount;
            if (availableSale.remainingAmount === 0) {
              availableSale.status = MarketStatus.Cancelled;
              sellerNft.sale = null;
            }

            await this.saleModel.findOneAndUpdate(
              { _id: availableSale._id },
              { $set: availableSale },
            );
          }

          updateNftItems.push({
            updateOne: {
              filter: {
                tokenId,
                nftContract: collection,
                owner: sellerUser,
              },
              update: { $set: sellerNft },
            },
          });
        }

        const buyerNft = await this.nftModel.findOne({
          tokenId,
          nftContract: collection,
          owner: buyerUser,
        });
        if (buyerNft) {
          if (buyerNft.blockTime <= timestamp) {
            buyerNft.amount += amount;
            buyerNft.blockTime = timestamp;

            updateNftItems.push({
              updateOne: {
                filter: {
                  _id: buyerNft._id,
                },
                update: { $set: buyerNft },
              },
            });
          }
        } else {
          const newBuyerNft: Nfts = {
            tokenId,
            nftContract: collection,
            nftCollection,
            chain,
            blockTime: timestamp,
            royaltyRate: 0,
            creator: buyerNft.creator,
            owner: buyerUser,
            amount,
            marketType: MarketType.NotForSale,
          };
          updateNftItems.push({ insertOne: newBuyerNft });
        }

        if (offer) {
          updateOffer.push({
            updateOne: {
              filter: {
                _id: offer._id,
              },
              update: {
                $set:
                  remainingUsage == 0
                    ? {
                        remainingAmount: remainingUsage,
                        status: OfferStatus.Accepted,
                      }
                    : {
                        remainingAmount: remainingUsage,
                      },
              },
            },
          });
        }

        await this.offerModel.updateMany(
          {
            _id: { $ne: offer._id },
            remainingAmount: { $gt: sellerNft.amount },
            status: OfferStatus.Pending,
          },
          { $set: { status: OfferStatus.Cancelled } },
        );
      } catch (error) {}
    }

    if (updateNftItems.length > 0) {
      await this.nftModel.bulkWrite(updateNftItems);
    }

    if (updateOffer.length > 0) {
      await this.offerModel.bulkWrite(updateOffer);
    }
  }

  async processPhaseDropUpdated(log: LogsReturnValues, chain: ChainDocument) {
    const {
      nftAddress,
      phaseDropId,
      mintPrice,
      currency,
      startTime,
      endTime,
      maxMintPerWallet,
      phaseType,
      timestamp,
    } = log.returnValues as PhaseDropUpdatedReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    const paymentToken = await this.paymentTokenModel.findOne({
      contractAddress: currency,
    });

    const newDropPhase: DropPhases = {
      nftCollection,
      phaseId: phaseDropId,
      mintPrice,
      paymentToken,
      startTime,
      endTime,
      updatedTime: timestamp,
      limitPerWallet: maxMintPerWallet,
      phaseType: phaseType === 1 ? PhaseType.PublicMint : PhaseType.PrivateMint,
    };

    const phaseDropDocument = await this.dropPhaseModel.findOneAndUpdate(
      {
        nftCollection,
        phaseId: phaseDropId,
        updatedTime: { $lte: timestamp },
      },
      { $set: newDropPhase },
      { upsert: true, new: true },
    );

    if (!nftCollection.dropPhases.includes(phaseDropDocument._id)) {
      nftCollection.dropPhases.push(phaseDropDocument);
      await nftCollection.save();
    }
  }

  async processCreatorPayoutUpdated(
    log: LogsReturnValues,
    chain: ChainDocument,
  ) {
    const { nftAddress, newPayoutAddress } =
      log.returnValues as CreatorPayoutUpdatedReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    const payoutUser = await this.userService.getOrCreateUser(newPayoutAddress);
    nftCollection.creatorPayout = payoutUser;
    await nftCollection.save();
  }

  async processPayerUpdated(log: LogsReturnValues, chain: ChainDocument) {
    const { nftAddress, payer, allowed } =
      log.returnValues as PayerUpdatedReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      nftAddress,
      chain,
    );

    const payerUser = await this.userService.getOrCreateUser(payer);
    const oldPayers = nftCollection.payers;
    if (allowed) {
      nftCollection.payers.push(payerUser);
    } else {
      if (oldPayers.length > 0) {
        nftCollection.payers = oldPayers.filter(
          payerUser => payerUser.address != payer,
        );
      }
    }

    await nftCollection.save();
  }

  async processItemStaked(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const { collection, tokenId, owner, stakedAt } =
      log.returnValues as ItemStakedReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      collection,
      chain,
    );

    const ownerUser = await this.userService.getOrCreateUser(owner);
    const stakingUser = await this.userService.getOrCreateUser(
      log.events[0].from_address,
    );

    const nftDocument = await this.nftModel.findOne({
      nftContract: collection,
      tokenId,
      owner: ownerUser,
    });

    if (nftDocument) {
      nftDocument.owner = stakingUser;
      nftDocument.blockTime = stakedAt;
      nftDocument.sale = null;
      nftDocument.marketType = MarketType.NotForSale;
      await nftDocument.save();
    }

    await this.stakingModel.findOneAndUpdate(
      {
        nftContract: collection,
        tokenId,
        user: ownerUser,
      },
      {
        $set: {
          nftContract: collection,
          tokenId,
          user: ownerUser,
        },
      },
      { upsert: true },
    );

    const history: Histories = {
      nft: nftDocument,
      tokenId,
      nftContract: collection,
      nftCollection,
      from: ownerUser,
      to: stakingUser,
      amount: 1,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp: stakedAt,
      chain,
      type: HistoryType.Stake,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: collection,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );
    await this.signatureModel
      .updateMany(
        {
          token_id: tokenId,
          contract_address: collection,
          status: {
            $in: [
              SignStatusEnum.BID,
              SignStatusEnum.LISTING,
              SignStatusEnum.BUYING,
              SignStatusEnum.BIDDING,
            ],
          },
        },
        {
          status: SignStatusEnum.ORDER_CANCEL,
        },
      )
      .exec();
  }

  async processItemUnstaked(
    log: LogsReturnValues,
    chain: ChainDocument,
    index: number,
  ) {
    const { collection, tokenId, owner, unstakedAt, point } =
      log.returnValues as ItemUnStakedReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      collection,
      chain,
    );

    const ownerUser = await this.userService.getOrCreateUser(owner);
    const stakingUser = await this.userService.getOrCreateUser(
      log.events[0].from_address,
    );

    const nftDocument = await this.nftModel.findOne({
      nftContract: collection,
      tokenId,
      owner: stakingUser,
    });

    if (nftDocument) {
      nftDocument.owner = ownerUser;
      nftDocument.blockTime = unstakedAt;
      await nftDocument.save();
    }

    await this.stakingModel.findOneAndDelete({
      nftContract: collection,
      tokenId,
      user: ownerUser,
    });

    const history: Histories = {
      nft: nftDocument,
      tokenId,
      nftContract: collection,
      nftCollection,
      from: stakingUser,
      to: ownerUser,
      amount: 1,
      price: 0,
      priceInUsd: 0,
      txHash: log.transaction_hash,
      index,
      timestamp: unstakedAt,
      chain,
      type: HistoryType.Unstake,
      point,
    };

    await this.historyModel.findOneAndUpdate(
      {
        nftContract: collection,
        tokenId,
        txHash: log.transaction_hash,
        index,
      },
      { $set: history },
      { upsert: true, new: true },
    );
  }

  async processUpdateDrop(log: LogsReturnValues, chain: ChainDocument) {
    const {
      collectible,
      dropType,
      secureAmount,
      fromTopSupporter,
      toTopSupporter,
      isRandomToSubscribers,
    } = log.returnValues as UpdateDropReturnValue;

    const nftCollection = await this.getOrCreateNftCollection(
      collectible,
      chain,
    );

    const set = await this.flexHausSetModel.findOne({
      collectibles: { $in: [nftCollection._id] },
    });

    const newDrop: FlexHausDrop = {
      collectible: nftCollection,
      creator: nftCollection.owner,
      dropType:
        dropType === 1 ? FlexHausDropType.Free : FlexHausDropType.Protected,
      secureAmount,
      isRandomToSubscribers,
      fromTopSupporter,
      toTopSupporter,
      set,
    };

    await this.flexHausDropModel.findOneAndUpdate(
      { collectible: nftCollection },
      { $set: newDrop },
      { upsert: true, new: true },
    );
  }
}
