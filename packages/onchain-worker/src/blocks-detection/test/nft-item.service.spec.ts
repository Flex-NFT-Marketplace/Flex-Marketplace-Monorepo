import { Connection, Model, connect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  BlockDocument,
  BlockSchema,
  Blocks,
  ChainDocument,
  ChainSchema,
  Chains,
  DropPhaseSchema,
  DropPhases,
  Histories,
  HistorySchema,
  MarketStatus,
  MarketType,
  NftCollectionSchema,
  ContractStandard,
  NftCollections,
  NftSchema,
  Nfts,
  NotificationSchema,
  Notifications,
  OfferSchema,
  Offers,
  PaymentTokenSchema,
  PaymentTokens,
  SaleSchema,
  Sales,
  UserSchema,
  Users,
} from '@app/shared/models';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import chain from './mocks/chain.json';
import paymentToken from './mocks/paymentToken.json';
import users from './mocks/users.json';
import nftCollections from './mocks/nftcollection.json';
import nfts from './mocks/nft.json';
import sales from './mocks/sales.json';
import { Web3Service } from '@app/web3-service/web3.service';
import { BlockDetectionService } from '../block-detection.service';
import { Provider } from 'starknet';
import { NftItemService } from 'onchain-queue/src/queues';
import { UserService } from 'marketplace-service/src/user/user.service';

describe('NFT item service', () => {
  let nftItemService: NftItemService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<Users>;
  let nftCollectionModel: Model<NftCollections>;
  let nftModel: Model<Nfts>;
  let historyModel: Model<Histories>;
  let paymentTokenModel: Model<PaymentTokens>;
  let chainModel: Model<Chains>;
  let blockModel: Model<BlockDocument>;
  let saleModel: Model<Sales>;
  let offerModel: Model<Offers>;
  let dropPhaseModel: Model<DropPhases>;
  let notificationModel: Model<Notifications>;
  let chainDocument: ChainDocument;
  let web3Service: Web3Service;
  let provider: Provider;
  let blockDetectionService: BlockDetectionService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(Users.name, UserSchema);
    nftCollectionModel = mongoConnection.model(
      NftCollections.name,
      NftCollectionSchema,
    );
    paymentTokenModel = mongoConnection.model(
      PaymentTokens.name,
      PaymentTokenSchema,
    );
    chainModel = mongoConnection.model(Chains.name, ChainSchema);
    blockModel = mongoConnection.model<BlockDocument>(Blocks.name, BlockSchema);
    nftModel = mongoConnection.model(Nfts.name, NftSchema);
    historyModel = mongoConnection.model(Histories.name, HistorySchema);
    saleModel = mongoConnection.model(Sales.name, SaleSchema);
    offerModel = mongoConnection.model(Offers.name, OfferSchema);
    dropPhaseModel = mongoConnection.model(DropPhases.name, DropPhaseSchema);
    notificationModel = mongoConnection.model(
      Notifications.name,
      NotificationSchema,
    );
    chainDocument = await chainModel.create(chain);
    const paymentTokenEntity: PaymentTokens = {
      ...paymentToken,
      chain: chainDocument,
    };
    const paymentTokenDocument =
      await paymentTokenModel.create(paymentTokenEntity);
    provider = new Provider({ nodeUrl: chain.rpc });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftItemService,
        UserService,
        Web3Service,
        { provide: getModelToken(Chains.name), useValue: chainModel },
        { provide: getModelToken(Users.name), useValue: userModel },
        {
          provide: getModelToken(NftCollections.name),
          useValue: nftCollectionModel,
        },
        {
          provide: getModelToken(PaymentTokens.name),
          useValue: paymentTokenModel,
        },
        {
          provide: getModelToken(Blocks.name),
          useValue: blockModel,
        },
        { provide: getModelToken(Nfts.name), useValue: nftModel },
        { provide: getModelToken(Histories.name), useValue: historyModel },
        { provide: getModelToken(Sales.name), useValue: saleModel },
        { provide: getModelToken(Offers.name), useValue: offerModel },
        { provide: getModelToken(DropPhases.name), useValue: dropPhaseModel },
        {
          provide: getModelToken(Notifications.name),
          useValue: notificationModel,
        },
      ],
    }).compile();
    nftItemService = module.get<NftItemService>(NftItemService);
    web3Service = module.get<Web3Service>(Web3Service);
    blockDetectionService = new BlockDetectionService(
      blockModel,
      web3Service,
      chainDocument,
      nftItemService,
    );

    const userDocuments = await userModel.insertMany(users);

    await blockDetectionService.init();

    const nftCollectionDocuments = [];
    for (let i = 0; i < nftCollections.length; i++) {
      const nftCollectionEntity: NftCollections = {
        ...nftCollections[i],
        chain: chainDocument,
        paymentTokens: [paymentTokenDocument],
        standard: nftCollections[i].standard as ContractStandard,
        dropPhases: [],
      };
      const nftCollectionDocument =
        await nftCollectionModel.create(nftCollectionEntity);
      nftCollectionDocuments.push(nftCollectionDocument);
    }

    const nftDocuments = [];
    for (let i = 0; i < nfts.length; i++) {
      const nftEntity: Nfts = {
        ...nfts[i],
        owner: userDocuments[i],
        nftCollection: nftCollectionDocuments[i],
        chain: chainDocument,
        marketType: MarketType.NotForSale,
      };
      const nftDocument = await nftModel.create(nftEntity);
      nftDocuments.push(nftDocument);
      await blockDetectionService.init();
    }

    // for (let i = 0; i < sales.length; i++) {
    //   const saleEntity: Sales = {
    //     ...sales[i],
    //     nft: nftDocuments[i],
    //     signer: nftDocuments[i].owner,
    //     nftContract: nftCollectionDocuments[i].nftContract,
    //     nftCollection: nftCollectionDocuments[i],
    //     paymentToken: paymentTokenDocument,
    //     status: MarketStatus.OnSale,
    //   };
    //   const saleDocument = await saleModel.create(saleEntity);
    //   await nftModel.findOneAndUpdate(
    //     { _id: nftDocuments[i]._id },
    //     { $set: { sale: saleDocument } },
    //   );
    // }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('testing service', () => {
    // it('processContractDeployed', async () => {
    //   const block = await provider.getBlock(175293);
    //   await blockDetectionService.processTx(
    //     '0x05ab69287f62819eeb1f3ca6d72fdec85280aaa29152a19a13a9a87e5634f662',
    //     block.timestamp,
    //   );

    //   const nftCollection = await nftCollectionModel.findOne();
    //   console.log(nftCollection);
    // });

    it('processNft721Minted', async () => {
      const block = await provider.getBlock(55981);
      await blockDetectionService.processTx(
        {
          txHash:
            '0x07eb55fd74a1e3055318022bdbcd6c784ad196fb3946e102008cef38cbe9c0d4',
          status: 0,
        },
        block.timestamp * 1e3,
      );

      // const nftCollection = await nftCollectionModel.findOne();
      // const nft = await nftModel.findOne().populate('nftCollection');
      const history = await historyModel.find();
      console.log({ history });
    }, 60000);

    // it('processNft1155Transfered', async () => {
    //   const block = await provider.getBlock(51805);
    //   // const nftsBefore = await nftModel.find();
    //   // console.log(`Before processTx ${nftsBefore}`);

    //   // const salesBefore = await saleModel.find();
    //   // console.log(`Before processTx ${salesBefore}`);

    //   await blockDetectionService.processTx(
    //     '0x00df9751bbaa8cb1a14f7405a66a270092bb7b7d1455579d5e429109de221b65',
    //     block.timestamp * 1e3,
    //   );

    //   const nfts = await nftModel.find();
    //   console.log(nfts);

    //   const sales = await saleModel.find();
    //   console.log(sales);

    //   const totalAmount = nfts[1].amount;

    //   expect(
    //     sales.reduce((acc, cur) => acc + cur.remainingAmount, 0),
    //   ).toBeLessThanOrEqual(totalAmount);
    // });

    // it('processNft1155TransferedBatch', async () => {
    //   const block = await provider.getBlock(57727);
    //   const nftsBefore = await nftModel.find();
    //   console.log(`Before processTx ${nftsBefore}`);

    //   await blockDetectionService.processTx(
    //     '0x06f4f5a7f3c27d58fa30bf9c39889d4076966d3c3e28fc58650ded1bbde63dfe',
    //     block.timestamp * 1e3,
    //   );

    //   const nfts = await nftModel.find();
    //   console.log(nfts);
    // });

    // it('processTakerBid', async () => {
    //   const block = await provider.getBlock(56020);
    //   await blockDetectionService.processTx(
    //     '0x07eb55fd74a1e3055318022bdbcd6c784ad196fb3946e102008cef38cbe9c0d4',
    //     block.timestamp * 1e3,
    //   );

    //   const nfts = await nftModel.find();
    //   console.log(nfts);
    // });

    // it('processPhaseDropUpdated', async () => {
    //   const block = await provider.getBlock(55717);
    //   await blockDetectionService.processTx(
    //     '0x027f4509e95167c4bcd520dd1d9d8c7a7791e829b544dfeb538fd76174d58d3f',
    //     block.timestamp * 1e3,
    //   );

    //   const nftCollection = await nftCollectionModel
    //     .find()
    //     .populate(['dropPhases']);

    //   console.log(nftCollection[2]);
    // });
  });
});
