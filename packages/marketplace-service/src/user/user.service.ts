import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UpdateInfoReqDTO } from '@app/shared/modules/dtos-query/user.dto';
import { Web3Service } from '@app/web3-service/web3.service';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
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
        nonce: Math.floor(Math.random() * 1000000),
        isVerified: false,
        roles: [],
        classHash,
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
  async updateRandomNonce(address: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { address: address },
        { nonce: Math.floor(Math.random() * 1000000) },
        { new: true },
      )
      .exec();

    return user;
  }

  async getUser(userAddress: string): Promise<UserDocument> {
    return await this.userModel.findOne({ address: userAddress });
  }
  async updateUserInformation(query: UpdateInfoReqDTO) {
    const update: any = {};
    if (query.avatar) {
      update['.avatar'] = query.avatar;
    }
  }
}
