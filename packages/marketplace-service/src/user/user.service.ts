import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3-service/web3.service';
import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';
import { UpdateUserInfo } from './dto/updateUser.dto';
import { GetUserInfoDto, UserResponseDto } from './dto/getUser.dto';
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

  async getUserInfo(query: GetUserInfoDto): Promise<UserResponseDto> {
    const filter: any = {};

    if (query.address) {
      filter.address = formattedContractAddress(query.address);
    }

    if (Object.keys(filter).length === 0) {
      throw new HttpException('Need atleast 1 filter', HttpStatus.BAD_REQUEST);
    }
    // if (!filter.username) {
    //   return await this.getOrCreateUser(filter.address);
    // }

    const user = await this.userModel.findOne(filter);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const userDto: UserResponseDto = {
      username: user.username,
      address: user.address,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      email: user.email,
      avatar: user.avatar,
      cover: user.cover,
      about: user.about,
      socials: user.socials ? user.socials : {},
    };
    return userDto;
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
    if (query.social) {
      update.socials = query.social;
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
