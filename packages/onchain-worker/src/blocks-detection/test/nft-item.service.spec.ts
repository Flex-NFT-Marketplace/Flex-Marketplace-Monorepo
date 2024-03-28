import { Connection, Model, connect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  BlockDocument,
  BlockSchema,
  Blocks,
  ChainDocument,
  ChainSchema,
  Chains,
  NftCollectionSchema,
  NftCollections,
  PaymentTokenSchema,
  PaymentTokens,
  UserSchema,
  Users,
} from '@app/shared/models';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from '../../users/user.service';
import { NftItemService } from '../nft-item.service';
import chain from './mocks/chain.json';
import paymentToken from './mocks/paymentToken.json';
import { Web3Service } from '@app/web3-service/web3.service';
import { BlockDetectionService } from '../block-detection.service';
import { Provider } from 'starknet';

describe('NFT item service', () => {
  let nftItemService: NftItemService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<Users>;
  let nftCollectionModel: Model<NftCollections>;
  let paymentTokenModel: Model<PaymentTokens>;
  let chainModel: Model<Chains>;
  let blockModel: Model<BlockDocument>;
  let chainDocument: ChainDocument;
  let web3Service: Web3Service;
  let provider: Provider;

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
    chainDocument = await chainModel.create(chain);
    const paymentTokenEntity: PaymentTokens = {
      ...paymentToken,
      chain: chainDocument,
    };
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
      ],
    }).compile();
    nftItemService = module.get<NftItemService>(NftItemService);
    web3Service = module.get<Web3Service>(Web3Service);
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
    it('processContractDeployed', async () => {
      const blockDetectionService = new BlockDetectionService(
        blockModel,
        web3Service,
        chainDocument,
        nftItemService,
      );

      await blockDetectionService.init();

      const block = await provider.getBlock(175293);
      await blockDetectionService.processTx(
        '0x05ab69287f62819eeb1f3ca6d72fdec85280aaa29152a19a13a9a87e5634f662',
        block.timestamp,
      );

      const nftCollection = await nftCollectionModel.findOne();
      console.log(nftCollection);
    });
  });
});
