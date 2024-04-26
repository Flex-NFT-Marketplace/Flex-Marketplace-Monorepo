import { UserDocument, Users } from '@app/shared/models/schemas';
import { formattedContractAddress } from '@app/shared/utils';
import { Web3Service } from '@app/web3-service/web3.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) public userModel: Model<UserDocument>,
    private readonly web3Service: Web3Service,
  ) {}

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
}
