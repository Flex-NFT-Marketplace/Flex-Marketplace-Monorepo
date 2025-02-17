import configuration from '@app/shared/configuration';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import {
  ChainDocument,
  Chains,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import { Web3Service } from '@app/web3-service/web3.service';
import { BaseMetadataDto } from './dto/baseMetadata.dto';
import { HttpService } from '@nestjs/axios';

const getUrl = (url: string) => {
  if (url.startsWith('ipfs://')) {
    return url?.replace('ipfs://', configuration().ipfs_gateway);
  }

  if (url.startsWith('https://ipfs.io/ipfs/')) {
    return url?.replace('https://ipfs.io/ipfs/', configuration().ipfs_gateway);
  }
  return url;
};

@Injectable()
export class BaseUriService {
  constructor(
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {
    this.client = axios.create({
      timeout: 1000 * 10, // Wait for 5 seconds
    });
  }
  client: AxiosInstance;
  logger = new Logger(BaseUriService.name);

  async loadBaseUri(id: string) {
    const nftCollection = await this.nftCollectionModel.findById(id);
    const { nftContract } = nftCollection;
    const chain = await this.chainModel.findOne();
    let baseUri: string;
    if (nftCollection.contractUri) {
      baseUri = nftCollection.contractUri;
    } else {
      baseUri = await this.web3Service.getCollectibleBaseUri(
        nftContract,
        chain.rpc,
      );
    }

    if (!baseUri) return null;

    const httpUrl = getUrl(baseUri);

    this.logger.debug(
      `baseUri of ${nftCollection.nftContract} is '${httpUrl}'`,
    );

    let metadata: BaseMetadataDto;
    try {
      metadata = (await this.httpService.axiosRef.get(httpUrl)).data;
    } catch (error) {
      nftCollection.contractUri = baseUri;
      await nftCollection.save();
      throw new Error(error);
    }

    const newNftCollection = await this.nftCollectionModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          avatar: metadata.image,
          description: metadata.description,
          contractUri: baseUri,
        },
      },
      { new: true },
    );

    return newNftCollection;
  }
}
