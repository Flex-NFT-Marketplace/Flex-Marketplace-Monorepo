import { Connection, Model, connect } from 'mongoose';
import { UserService } from '../user.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserSchema, Users } from '@app/shared/models';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { formattedContractAddress } from '@app/shared/utils';
import { Web3Service } from '@app/web3-service/web3.service';

describe('User service', () => {
  let userService: UserService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<Users>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(Users.name, UserSchema);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        Web3Service,
        { provide: getModelToken(Users.name), useValue: userModel },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);
    userModel = module.get<Model<Users>>(getModelToken(Users.name));
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
    it('getOrCreateUser', async () => {
      const userAddress =
        '0x70B17dd4ca449Ad789839ebA91B74Ebbd9A0217960161E120f8Ce3f39E08bfD';
      await userService.getOrCreateUser(userAddress);

      expect((await userModel.findOne()).address).toEqual(
        formattedContractAddress(userAddress),
      );
    });
  });
});
