import {
  ChainDocument,
  Chains,
  DropPhaseDocument,
  DropPhases,
  NftCollectionDocument,
  NftCollections,
  WhitlistType,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateWarpcastDetailDto } from './dto/updateWarpcastDetail.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { UserService } from '../user/user.service';
import {
  formattedContractAddress,
  getProofWhiteListMessage,
} from '@app/shared/utils';
import { retryUntil } from '@app/shared/index';
import { UpdateWhitelistMintDto } from './dto/updateWhitelist.dto';
import * as _ from 'lodash';
import {
  DropPhaseType,
  GetCollectionDropPhasesDto,
} from './dto/getCollectionDropPhases.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { GetCollectionDropPhaseDto } from './dto/getCollectionDropPhase.dto';
import { WhitelistProofDto } from './dto/whitelistProof.dto';
import { Web3Service } from '@app/web3-service/web3.service';
import configuration from '@app/shared/configuration';
import { stark, CallData } from 'starknet';
import { ClaimFrameDto } from './dto/claimFrame.dto';
import { decryptData } from '@app/shared/utils/encode';
import { FLEX } from '@app/shared/constants';

@Injectable()
export class DropPhaseService {
  constructor(
    @InjectModel(DropPhases.name)
    private readonly dropPhaseModel: Model<DropPhaseDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    private readonly userService: UserService,
    private readonly web3Service: Web3Service,
  ) {}

  async getDropPhases(
    query: GetCollectionDropPhasesDto,
  ): Promise<BaseResultPagination<DropPhaseDocument>> {
    const { page, size, skipIndex } = query;
    const result: BaseResultPagination<DropPhaseDocument> =
      new BaseResultPagination();
    const filter: any = {};

    if (query.nftContract) {
      const formatedAddress = formattedContractAddress(query.nftContract);
      const nftCollection = await this.nftCollectionModel.findOne({
        nftContract: formatedAddress,
      });

      if (!nftCollection) {
        throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
      }

      filter.nftCollection = nftCollection;
    }

    if (query.dropPhaseType) {
      const now = Date.now();
      switch (query.dropPhaseType) {
        case DropPhaseType.LiveNow:
          filter.startTime = { $lte: now };
          filter.endTime = { $gt: now };
          break;
        case DropPhaseType.UpComming:
          filter.startTime = { $gt: now };
          break;
        case DropPhaseType.Ended:
          filter.endTime = { $lte: now };
          break;
      }
    }

    const total = await this.dropPhaseModel.countDocuments(filter);
    if (total == 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.dropPhaseModel.aggregate([
      {
        $match: filter,
      },
      { $sort: { startTime: -1 } },
      { $skip: skipIndex },
      { $limit: size },
      {
        $lookup: {
          from: 'nftcollections',
          localField: 'nftCollection',
          foreignField: '_id',
          as: 'nftCollection',
        },
      },
      {
        $unwind: '$nftCollection',
      },
      {
        $lookup: {
          from: 'nfts',
          let: { nftCollection: '$nftCollection._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$nftCollection', '$nftCollection'] },
                    { $eq: ['$isBurned', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: 0,
                totalNfts: { $sum: '$amount' },
              },
            },
            {
              $project: {
                _id: 0,
                supply: '$totalNfts',
              },
            },
          ],
          as: 'supply',
        },
      },
      {
        $unwind: {
          path: '$supply',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          // Include all fields from the root document
          root: '$$ROOT',
          // Add or modify specific fields
          updatedNftCollection: {
            $mergeObjects: [
              '$nftCollection', // The original nftCollection object
              { supply: { $ifNull: ['$supply.supply', 0] } }, // Updated or new supply field
            ],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$root',
              { nftCollection: '$updatedNftCollection' },
            ],
          },
        },
      },
      {
        $project: {
          supply: 0,
        },
      },
    ]);

    result.data = new PaginationDto(items, total, page, size);
    return result;
  }

  async getPhaseDetail(
    query: GetCollectionDropPhaseDto,
  ): Promise<BaseResult<DropPhases>> {
    const { nftContract, phaseId } = query;
    const formatedAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatedAddress,
    });

    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    return new BaseResult(phaseDetail);
  }

  async getWhitelistProof(
    user: string,
    query: GetCollectionDropPhaseDto,
  ): Promise<BaseResult<WhitelistProofDto>> {
    const { nftContract, phaseId } = query;

    const formatedUserAddress = formattedContractAddress(user);
    const formatedNftAddress = formattedContractAddress(nftContract);

    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatedNftAddress,
    });
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    const whitelistUser = phaseDetail.whitelist.find(
      i => i.address === formatedUserAddress,
    );
    if (!whitelistUser) {
      throw new HttpException(
        'You are not in whitelist',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    if (whitelistUser.isUsed) {
      throw new HttpException('Proof already used', HttpStatus.NOT_ACCEPTABLE);
    }

    const proofMessage = getProofWhiteListMessage(
      formatedNftAddress,
      phaseId,
      formatedUserAddress,
    );
    const chainDocument = await this.chainModel.findOne();

    const validatorInstance = this.web3Service.getAccountInstance(
      configuration().validator.address,
      configuration().validator.privateKey,
      chainDocument.rpc,
    );

    const proof = await validatorInstance.signMessage(proofMessage);
    const formattedProof = stark.formatSignature(proof);
    return new BaseResult({
      userAddress: formatedUserAddress,
      nftContract,
      phaseId,
      proof: formattedProof,
    });
  }

  async updateWhitelistProof(
    user: string,
    query: GetCollectionDropPhaseDto,
  ): Promise<BaseResult<string>> {
    const { nftContract, phaseId } = query;

    const formatedUserAddress = formattedContractAddress(user);
    const formatedNftAddress = formattedContractAddress(nftContract);

    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatedNftAddress,
    });
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    const whitelistUser = phaseDetail.whitelist.find(
      i => i.address === formatedUserAddress,
    );
    if (!whitelistUser) {
      throw new HttpException(
        'You are not in whitelist',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    if (whitelistUser.isUsed) {
      throw new HttpException(
        'Proof already updated',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const newWhitelist = phaseDetail.whitelist.map(i => {
      if (i.address === formatedUserAddress) {
        i.isUsed = true;
      }
      return i;
    });

    await this.dropPhaseModel.findOneAndUpdate(
      { nftCollection, phaseId },
      { $set: { whitelist: newWhitelist } },
    );

    return new BaseResult('Update whitelist proof successful.');
  }

  async claimFrame(query: ClaimFrameDto): Promise<BaseResult<string>> {
    const { nftContract, phaseId, minter, quantity } = query;
    const formattedNftAddress = formattedContractAddress(nftContract);
    const formattedUserAddress = formattedContractAddress(minter);

    const nftCollection = await this.nftCollectionModel
      .findOne({
        nftContract: formattedNftAddress,
      })
      .populate(['payers']);

    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    if (Date.now() >= phaseDetail.endTime) {
      throw new HttpException(
        'Drop phase has ended',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const payerDocument = nftCollection.payers[0];
    if (!payerDocument) {
      throw new HttpException('Payer not found', HttpStatus.NOT_FOUND);
    }

    const decodePrivateKey = decryptData(payerDocument.privateKey);
    const chainDocument = await this.chainModel.findOne();
    const account = this.web3Service.getAccountInstance(
      payerDocument.address,
      decodePrivateKey,
      chainDocument.rpc,
    );

    const provider = this.web3Service.getProvider(chainDocument.rpc);
    const execute = await account.execute([
      {
        contractAddress: FLEX.FLEXDROP_MAINNET,
        entrypoint: 'mint_public',
        calldata: CallData.compile({
          nft_address: formattedNftAddress,
          phase_id: phaseId,
          fee_recipient: FLEX.FLEX_RECIPT,
          minter_if_not_payer: minter,
          quantity,
          is_warpcast: true,
        }),
      },
    ]);

    await provider.waitForTransaction(execute.transaction_hash);

    return new BaseResult(
      `Claim successful with transaction hash - ${execute.transaction_hash}`,
    );
  }

  async editWarpcastDetail(
    owner: string,
    body: UpdateWarpcastDetailDto,
  ): Promise<BaseResult<string>> {
    const ownerDocument = await this.userService.getOrCreateUser(owner);

    const {
      nftContract,
      phaseId,
      warpcastImage,
      quests,
      totalWarpcastMint,
      farcasterFid,
    } = body;

    const formatedAddress = formattedContractAddress(nftContract);
    let nftCollection: NftCollectionDocument;
    await retryUntil(
      async () => {
        nftCollection = await this.nftCollectionModel.findOne({
          nftContract: formatedAddress,
          owner: ownerDocument,
        });
      },
      nftCollection => nftCollection !== null,
      5,
      2000,
    );

    if (!nftCollection) {
      throw new HttpException(
        'You are not the owner of the collecion.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let dropPhase: DropPhaseDocument;

    await retryUntil(
      async () => {
        dropPhase = await this.dropPhaseModel.findOne({
          nftCollection,
          phaseId,
        });
      },
      dropPhase => dropPhase !== null,
      10,
      2000,
    );

    if (!dropPhase) {
      throw new HttpException('Drop phase not found.', HttpStatus.NOT_FOUND);
    }

    await this.dropPhaseModel.findOneAndUpdate(
      {
        nftCollection,
        phaseId,
      },
      {
        $set: {
          farcasterFid,
          quests,
          warpcastImage,
          totalWarpcastMint,
        },
      },
    );

    return new BaseResult('Update Warpcast detail successful.');
  }

  async updateWhitelist(
    owner: string,
    body: UpdateWhitelistMintDto,
  ): Promise<BaseResult<string>> {
    const ownerDocument = await this.userService.getOrCreateUser(owner);
    const { nftContract, phaseId, whitelist } = body;
    const formatedAddress = formattedContractAddress(nftContract);

    let nftCollection: NftCollectionDocument;
    await retryUntil(
      async () => {
        nftCollection = await this.nftCollectionModel.findOne({
          nftContract: formatedAddress,
          owner: ownerDocument,
        });
      },
      nftCollection => nftCollection !== null,
      5,
      2000,
    );

    if (!nftCollection) {
      throw new HttpException(
        'You are not the owner of the collecion.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let dropPhase: DropPhaseDocument;

    await retryUntil(
      async () => {
        dropPhase = await this.dropPhaseModel.findOne({
          nftCollection,
          phaseId,
        });
      },
      dropPhase => dropPhase !== null,
      10,
      2000,
    );

    if (!dropPhase) {
      throw new HttpException('Drop phase not found.', HttpStatus.NOT_FOUND);
    }

    let whitelistEntity: WhitlistType[] = whitelist.map(item => {
      return { address: formattedContractAddress(item), isUsed: false };
    });

    whitelistEntity = _.unionBy(
      dropPhase.whitelist ? dropPhase.whitelist : [],
      whitelistEntity,
      'address',
    );

    await this.dropPhaseModel.findOneAndUpdate(
      {
        nftCollection,
        phaseId,
      },
      {
        $set: {
          whitelist: whitelistEntity,
        },
      },
    );

    return new BaseResult('Update Whitelist successful.');
  }
}
