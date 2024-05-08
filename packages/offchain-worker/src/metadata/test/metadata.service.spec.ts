import {
  ChainSchema,
  Chains,
  NftCollectionSchema,
  NftCollections,
  NftSchema,
  Nfts,
} from '@app/shared/models';
import { MetadataService } from '../metadata.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, connect } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Web3Service } from '@app/web3-service/web3.service';
import { getModelToken } from '@nestjs/mongoose';
import nft from './mocks/ nft.json';
import nftCollection from './mocks/collection.json';
import chain from './mocks/chain.json';

describe('Metadata Service', () => {
  let metatadaService: MetadataService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let nftModel: Model<Nfts>;
  let nftCollectionModel: Model<NftCollections>;
  let chainModel: Model<Chains>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    nftModel = mongoConnection.model(Nfts.name, NftSchema);
    nftCollectionModel = mongoConnection.model(
      NftCollections.name,
      NftCollectionSchema,
    );
    chainModel = mongoConnection.model(Chains.name, ChainSchema);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        Web3Service,
        { provide: getModelToken(Nfts.name), useValue: nftModel },
        {
          provide: getModelToken(NftCollections.name),
          useValue: nftCollectionModel,
        },
      ],
    }).compile();

    const chainDocument = await chainModel.create(chain);
    nftCollection.chain = chainDocument;
    const nftCollectionDocument =
      await nftCollectionModel.create(nftCollection);

    nft.nftCollection = nftCollectionDocument;
    nft.chain = chainDocument;
    metatadaService = module.get<MetadataService>(MetadataService);
    await nftModel.create(nft);
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
    it('loadMetadata', async () => {
      const nft = await nftModel.findOne();
      const fetchMetadata = await metatadaService.loadMetadata(nft._id);
      console.log(fetchMetadata);
    }, 60000);
  });
});
