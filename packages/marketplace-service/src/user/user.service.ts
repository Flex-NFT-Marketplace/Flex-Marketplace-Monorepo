import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Web3Service } from '@app/web3-service/web3.service';
import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';
import { UpdateInfoReqDTO } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(Users.name) private userModel: Model<Users>) {
    this.web3Service = new Web3Service();
  }
  web3Service: Web3Service;
  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    let user = await this.userModel.findOne({
      address: formatAddress,
    });
    if (!user) {
      const newUser: Users = {
        address: formatAddress,
        username: formatAddress,
        nonce: uuidv1(),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
  async updateRandomNonce(address: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(address);

    const user = await this.userModel
      .findOneAndUpdate(
        { address: formatAddress },
        { $set: { nonce: uuidv1() } },
        { new: true },
      )
      .exec();

    return user;
  }

  async getUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    return await this.userModel.findOne({ address: formatAddress });
  }
  async updateUserInformation(query: UpdateInfoReqDTO) {
    const update: any = {};
    if (query.avatar) {
      update['.avatar'] = query.avatar;
    }
  }
}
