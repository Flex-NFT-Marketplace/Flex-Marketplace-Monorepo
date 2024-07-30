import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, UserDto, Users } from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3-service/web3.service';
import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';
import { UpdateUserInfo } from './dto/updateUser.dto';
import { GetUserInfoDto } from './dto/getUser.dto';
import { BaseResult } from '@app/shared/types';

@Injectable()
export class UserService {
  constructor(@InjectModel(Users.name) private userModel: Model<Users>) {
    this.web3Service = new Web3Service();
  }
  web3Service: Web3Service;
  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    let user = await this.userModel.findOne(
      {
        address: formatAddress,
      },
      { privateKey: 0 },
    );
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

  async getUser(address: string): Promise<UserDocument> {
    return await this.userModel
      .findOne({
        address: formattedContractAddress(address),
      })
      .populate(['mappingAddress']);
  }

  async getUserInfo(query: GetUserInfoDto): Promise<UserDto> {
    const filter: any = {};

    if (query.address) {
      filter.address = formattedContractAddress(query.address);
    }

    if (query.username) {
      filter.username = query.username;
    }

    if (Object.keys(filter).length === 0) {
      throw new HttpException('Need atleast 1 filter', HttpStatus.BAD_REQUEST);
    }
    if (!filter.username) {
      return await this.getOrCreateUser(filter.address);
    }

    const user = await this.userModel.findOne(filter);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async updateUserInformation(userAddress: string, query: UpdateUserInfo) {
    const update: any = {};
    if (query.avatar) {
      update.avatar = query.avatar;
    }

    if (query.about) {
      update.about = query.about;
    }

    if (query.cover) {
      update.cover = query.cover;
    }

    if (query.email) {
      update.email = query.email;
    }

    if (query.username) {
      const existedUser = await this.userModel.findOne({
        username: query.username,
      });

      if (existedUser) {
        throw new HttpException(
          'Username already exist',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }

      update.username = query.username;
    }
    await this.userModel.findOneAndUpdate(
      { address: formattedContractAddress(userAddress) },
      { $set: update },
      { new: true },
    );

    return new BaseResult('Update profile successful.');
  }
}
