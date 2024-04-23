import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AuthService } from '../auth.service';

import { UserSchema, Users } from '@app/shared/models';
import userJsonTest from './mocks/users.json';
import { Model, Connection, connect } from 'mongoose';
import { UserService } from 'marketplace-service/src/user/user.service';

describe('Auth API Services', () => {
  let authSerivce: AuthService;
  let userModel: Model<Users>;
  let userService: UserService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  const address =
    '0x05a2F4c3BcbE542D6a655Fb31EcA2914F884dd8a1c23EA0B1b210746C28cfA3a';
  const privateKey =
    '0x959810447aef763d4f14e951f5ddc3e7e3c237c47e30035c901e1b85758b0c';
  const rpc = 'https://starknet-sepolia.public.blastapi.io';
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(Users.name, UserSchema);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        UserService,
        AuthService,
        { provide: getModelToken(Users.name), useValue: userModel },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);
    authSerivce = module.get<AuthService>(AuthService);

    const userDocuments = await userModel.insertMany(userJsonTest);
    console.log(userDocuments);
  });
  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  describe('getNonce', () => {
    it('should return a message', async () => {
      const user = await userService.getOrCreateUser(address);
      const message = await authSerivce.getSignMessage(address, user.nonce);

      expect(message).toBeDefined();
    });
  });
  describe('token', () => {
    it('Should Return a Access Token', async () => {
      const accessPayload = {
        sub: address,
        role: [],
      };
      const user = await userService.getUser(address);
      const signatureTest = await authSerivce.testSignMessage({
        address,
        privateKey,
        nonce: user.nonce,
      });

      // Verify Signature
      const result = await authSerivce.verifySignature(
        address,
        signatureTest.signature,
        rpc,
      );
      expect(result).toBeTruthy();
      const token = await authSerivce.generateToken(accessPayload);
      expect(token).toBeDefined();
    });
  });
});
