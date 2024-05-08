import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UserDocument, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { stark } from 'starknet';
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}
  async createWalletByEth(creatorAddress: string) {
    const privateKeyAX = stark.randomAddress();
  }
}
