import { InjectModel } from '@nestjs/mongoose';
import { Signature, UserDocument, Users } from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3-service/web3.service';
import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';
import { UpdateUserInfo } from './dto/updateUser.dto';
import { GetUserInfoDto, UserResponseDto } from './dto/getUser.dto';
import {
  BaseQueryParams,
  BaseResult,
  BaseResultPagination,
} from '@app/shared/types';
import { QueryUserActivity } from './dto/userActivity.dto';
import { SignatureDTO } from '../signature/dto/signature.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Signature.name) private signatureModel: Model<Signature>,
  ) {
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

  async getUserById(id: string): Promise<UserDocument> {
    return await this.userModel.findById(id);
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
      points: user.points ? user.points : 0,
      flexPoint: user.flexPoint ? user.flexPoint : 0,
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
        address: { $ne: userAddress },
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

  async getUserActivity(
    query: QueryUserActivity,
  ): Promise<BaseResultPagination<SignatureDTO>> {
    const { page, size, skipIndex, userAddress, status, sort } = query;
    const result = new BaseResultPagination<SignatureDTO>();
    console.log('Format Address', formattedContractAddress(userAddress));
    const filter: any = {};
    if (userAddress) {
      filter.signer = formattedContractAddress(userAddress);
    }
    if (status) {
      filter.status = status;
    }

    // const count = await this.signatureModel.countDocuments(filter);
    // if (count === 0 || size === 0) {
    //   result.data = new PaginationDto<SignatureDTO>([], count, page, size);
    //   return result;
    // }

    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }

    const items = await this.signatureModel
      .find(filter)
      .skip(skipIndex)
      .limit(size)
      .sort(sortOperators)
      .populate([
        {
          path: 'nft',
          populate: 'nftCollection',
        },
      ])
      .exec();

    result.data = new PaginationDto(items, 1, page, size);

    return result;
  }

  // async fomatAllUserAddress() {
  //   const documents = await this.signatureModel.find();

  //   for (const doc of documents) {
  //     try {
  //       console.log('Updating document ID: ', doc._id);
  //       const signatureArray = JSON.parse(doc.signature4);

  //       if (signatureArray.length > 1) {
  //         signatureArray[1] = formattedContractAddress(signatureArray[1]);
  //       }
  //       if (signatureArray.length > 2) {
  //         signatureArray[2] = formattedContractAddress(signatureArray[2]);
  //       }

  //       const updates = {
  //         contract_address: doc.contract_address
  //           ? formattedContractAddress(doc.contract_address)
  //           : doc.contract_address,
  //         signer: doc.signer
  //           ? formattedContractAddress(doc.signer)
  //           : doc.signer,
  //         buyer_address: doc.buyer_address
  //           ? formattedContractAddress(doc.buyer_address)
  //           : doc.buyer_address,
  //         signature4: JSON.stringify(signatureArray),
  //       };

  //       // Update the document in the database
  //       await this.signatureModel.findByIdAndUpdate(doc._id, updates, {
  //         new: true,
  //       });

  //       console.log(`Updated document ID: ${doc._id}`);
  //     } catch (error) {
  //       console.error('Error formatting document fields:', error);
  //     }
  //   }
  // }

  async getFlexPointLeaderboard(
    query: BaseQueryParams,
  ): Promise<BaseResultPagination<UserResponseDto>> {
    const { page, size, skipIndex, sort } = query;
    const result = new BaseResultPagination<UserResponseDto>();

    const total = await this.userModel.countDocuments();

    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }

    const items = await this.userModel.find(
      {},
      {
        address: 1,
        username: 1,
        flexPoint: 1,
        about: 1,
        avatar: 1,
        cover: 1,
        socials: 1,
        email: 1,
      },
      {
        sort: { flexPoint: -1 },
        skip: skipIndex,
        limit: size,
      },
    );

    result.data = new PaginationDto(items, total, page, size);

    return result;
  }

  async getFlexPointRanked(address: string) {
    const ranked = await this.userModel.aggregate([
      {
        $setWindowFields: {
          sortBy: { flexPoint: -1 },
          output: {
            rank: { $rank: {} },
          },
        },
      },
      { $match: { address: address } },
      {
        $project: {
          address: 1,
          username: 1,
          flexPoint: 1,
          about: 1,
          avatar: 1,
          cover: 1,
          socials: 1,
          email: 1,
          rank: 1,
        },
      },
    ]);

    if (ranked.length === 0) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    return ranked[0];
  }
}
