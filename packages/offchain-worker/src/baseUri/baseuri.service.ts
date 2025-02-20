import configuration from '@app/shared/configuration';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChainDocument,
  Chains,
  Metadata,
  MetadataDocument,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import { Web3Service } from '@app/web3-service/web3.service';

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
    @InjectModel(Metadata.name)
    private readonly metadataModel: Model<MetadataDocument>,
    private readonly web3Service: Web3Service,
  ) {}
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

    let metadata: MetadataDocument;
    try {
      let metadataId = httpUrl.replace(
        'https://api.hyperflex.market/metadata/',
        '',
      );
      metadata = await this.metadataModel.findById(metadataId);
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
