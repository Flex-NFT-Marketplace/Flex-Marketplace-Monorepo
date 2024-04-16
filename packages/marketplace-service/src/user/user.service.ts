import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
@Injectable()
export class UserService {
  constructor(@InjectModel(Users.name) private userModel: Model<Users>) {}
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
