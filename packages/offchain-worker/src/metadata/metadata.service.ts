import {
  Attribute,
  AttributeMap,
  NftCollectionDocument,
  NftCollections,
  NftDocument,
  Nfts,
} from '@app/shared/models';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import { Web3Service } from '@app/web3-service/web3.service';
import { typeOfVal } from '@app/shared/utils';
import configuration from '@app/shared/configuration';
import { MetaDataDto } from './dtos/metadata.dto';
import { isURL } from 'class-validator';
import mime from 'mime';

const getUrl = (url: string) =>
  url?.replace('ipfs://', configuration().ipfs_gateway);

@Injectable()
export class MetadataService {
  constructor(
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    private readonly web3Service: Web3Service,
  ) {
    this.client = axios.create({
      timeout: 1000 * 5, // Wait for 5 seconds
    });
  }
  client: AxiosInstance;
  logger = new Logger(MetadataService.name);

  async loadMetadata(id: string) {
    const nft = await this.nftModel
      .findById(id)
      .populate(['nftCollection', 'chain']);

    const { nftContract, nftCollection, tokenId, chain } = nft;
    const { standard } = nftCollection;

    const tokenURI = await this.web3Service.getNFTUri(
      nftContract,
      tokenId,
      standard,
      chain.rpc,
    );

    if (!tokenURI) return null;

    const httpUrl = getUrl(tokenURI);
    this.logger.debug(
      `tokenUrl of ${nft.nftContract}:${tokenId} is '${httpUrl}'`,
    );

    let metadata: MetaDataDto;
    if (!isURL(httpUrl)) {
      // try to parse data of encoded base64 file
      const parsedDataBase64 = this.parseJSON(tokenURI);
      if (!parsedDataBase64) {
        this.logger.warn(
          `tokenUrl of ${nft.nftContract}:${tokenId} is ${tokenURI} - not an validate url, skip`,
        );
        nft.tokenUri = tokenURI;
        await nft.save();
        return;
      }
      metadata = parsedDataBase64;
    } else {
      metadata = (await this.client.get(httpUrl)).data;
    }

    const attributes =
      metadata.attributes
        ?.filter(
          ({ value }) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== '',
        )
        .map(({ trait_type, value, display_type }) => ({
          trait_type: trait_type,
          value: value,
          display_type,
        })) || [];
    let animationFileType = undefined;
    try {
      if (metadata.animation_url) {
        const animation_url = getUrl(metadata.animation_url);
        const mimeType = mime.getType(animation_url);
        if (mimeType) {
          animationFileType = mimeType;
        } else {
          const headers = (await axios.head(animation_url)).headers;
          animationFileType = headers['content-type'];
        }
      }
    } catch (error) {
      this.logger.warn(error);
    }
    const rs = await this.nftModel.findOneAndUpdate(
      {
        tokenId: nft.tokenId,
        nftContract: nft.nftContract,
      },
      {
        name: metadata.name,
        image: metadata.image,
        originImage: metadata.image,
        description: metadata.description,
        attributes,
        tokenUrl: tokenURI,
        externalUrl: metadata.externalUrl,
        animationUrl: metadata.animation_url,
        animationPlayType: animationFileType,
      },
    );
    await this.reloadAttributeMap(nft.nftCollection, attributes);
    return rs;
  }

  async reloadAttributeMap(
    nftCollection: NftCollections,
    attributes: Attribute[],
  ) {
    const { attributesMap } = nftCollection;
    for (const attr of attributes) {
      const valType = typeOfVal(attr.value);
      const attributeMap = attributesMap.find(
        attrMap => attrMap.label === attr.trait_type,
      );
      if (attributeMap) {
        if (valType == 'number') {
          attributeMap.min =
            attributeMap.min < attr.value ? attributeMap.min : attr.value;
          attributeMap.max =
            attributeMap.max > attr.value ? attributeMap.max : attr.value;
        }
        if (valType == 'string') {
          if (!attributeMap.options.includes(attr.value)) {
            attributeMap.options.push(attr.value);
          }
        }
      } else {
        const newAttrMap: AttributeMap = {
          trait_type: attr.trait_type,
          label: attr.trait_type,
          type: valType,
        };
        if (valType == 'number') {
          newAttrMap.min = 0;
          newAttrMap.max = attr.value;
        }
        if (valType == 'string') {
          newAttrMap.options = [attr.value];
        }
        attributesMap.push(newAttrMap);
      }
    }
    await this.nftCollectionModel.updateOne(
      {
        _id: nftCollection._id,
      },
      nftCollection,
    );
  }

  parseJSON(data: string): any {
    try {
      if (data.startsWith('data:application/json;base64,')) {
        const decodedData = atob(
          data.replace('data:application/json;base64,', ''),
        );
        const parsedData = JSON.parse(decodedData);
        return parsedData;
      } else if (data.startsWith('data:application/json,')) {
        return JSON.parse(data.replace('data:application/json,', ''));
      }
    } catch (error) {
      return undefined;
    }
  }
}
