import {
  ChainDocument,
  NftCollectionDocument,
  NftCollectionDto,
  NftCollections,
  PaymentTokenDocument,
  PaymentTokens,
} from '@app/shared/models';
import { ContractDeployedReturnValue } from '@app/web3-service/decodeEvent';
import { EventType, LogsReturnValues } from '@app/web3-service/types';
import { Web3Service } from '@app/web3-service/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../users/user.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class NftItemService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    @InjectModel(PaymentTokens.name)
    private readonly paymentTokenModel: Model<PaymentTokenDocument>,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
  ) {}

  logger = new Logger(NftItemService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};
    process[EventType.DEPLOY_CONTRACT] = this.processContractDeployed;

    await process[log.eventType].call(this, log, chain);
  }

  async processContractDeployed(log: LogsReturnValues, chain: ChainDocument) {
    for (const returnValue of log.returnValues as ContractDeployedReturnValue[]) {
      const { address, deployer } = returnValue;
      const nftInfo = await this.web3Service.isNFTContractCreated(
        address,
        chain.rpc,
      );

      if (nftInfo) {
        const { name, symbol, standard } = nftInfo;

        const paymentTokens = await this.paymentTokenModel.find({
          chain: chain,
          isNative: true,
        });

        const ownerDocument = await this.userService.getOrCreateUser(deployer);

        const nftCollectionEntity: NftCollections = {
          name,
          symbol,
          key: address,
          nftContract: address,
          owner: ownerDocument,
          chain,
          standard,
          paymentTokens: paymentTokens,
          collaboratories: [],
        };
        const nftCollectionDto = plainToInstance(
          NftCollectionDto,
          nftCollectionEntity,
        );

        console.log(nftCollectionDto);

        const nftCollection = await this.nftCollectionModel.findOneAndUpdate(
          {
            chain,
            nftContract: address,
          },
          {
            $set: nftCollectionDto,
          },
          {
            new: true,
            upsert: true,
          },
        );

        this.logger.debug(`create collection ${nftCollection._id}`);
      }
    }
  }
}
