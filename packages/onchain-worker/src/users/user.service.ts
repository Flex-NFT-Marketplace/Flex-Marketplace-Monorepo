import { UserDocument, Users } from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3-service/web3.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) public userModel: Model<UserDocument>,
    private readonly web3Service: Web3Service,
  ) {}

  async getOrCreateUser(
    userAddress: string,
    rpc: string,
  ): Promise<UserDocument> {
    let user = await this.userModel.findOne({
      address: userAddress,
    });

    if (!user) {
      const provider = this.web3Service.getProvider(rpc);
      const classHash = await provider.getClassHashAt(userAddress);
      const newUser: Users = {
        address: userAddress,
        username: userAddress,
        classHash,
        nonce: Math.floor(Math.random() * 1000000),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
}
