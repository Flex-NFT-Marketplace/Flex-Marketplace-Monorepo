import {
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
import { formattedContractAddress } from '@app/shared/utils';
import { retryUntil } from '@app/shared/index';
import { UpdateWhitelistMintDto } from './dto/updateWhitelist.dto';
import * as _ from 'lodash';
import { GetCollectionDropPhasesDto } from './dto/getCollectionDropPhases.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { GetCollectionDropPhaseDto } from './dto/getCollectionDropPhase.dto';
import { WhitelistProofDto } from './dto/whitelistProof.dto';

@Injectable()
export class DropPhaseService {
  constructor(
    @InjectModel(DropPhases.name)
    private readonly dropPhaseModel: Model<DropPhaseDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    private readonly userService: UserService,
  ) {}

  async getDropPhases(
    query: GetCollectionDropPhasesDto,
  ): Promise<BaseResultPagination<DropPhaseDocument>> {
    const { nftContract, page, size, skipIndex } = query;
    const result: BaseResultPagination<DropPhaseDocument> =
      new BaseResultPagination();

    const formatedAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatedAddress,
    });

    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }
    const total = await this.dropPhaseModel.countDocuments({ nftCollection });
    if (total == 0) {
      result.data = new PaginationDto([], 0, page, size);
      return result;
    }

    const items = await this.dropPhaseModel.find(
      { nftCollection },
      {},
      { sort: { phaseId: -1 }, skip: skipIndex, limit: size },
    );

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
      nftContract,
    });
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
    }
    return null;
  }

  async editWarpcastDetail(
    owner: string,
    body: UpdateWarpcastDetailDto,
  ): Promise<BaseResult<string>> {
    const ownerDocument = await this.userService.getOrCreateUser(owner);

    const { nftContract, phaseId, warpcastImage, quests, totalWarpcastMint } =
      body;

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
