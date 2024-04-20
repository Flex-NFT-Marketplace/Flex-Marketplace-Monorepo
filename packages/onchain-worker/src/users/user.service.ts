import { UserDocument, Users } from '@app/shared/models/schemas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(Users.name) public userModel: Model<UserDocument>) {}

  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({
      address: userAddress,
    });

    if (!user) {
      const newUser: Users = {
        address: userAddress,
        username: userAddress,
        nonce: Math.floor(Math.random() * 1000000),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
}
