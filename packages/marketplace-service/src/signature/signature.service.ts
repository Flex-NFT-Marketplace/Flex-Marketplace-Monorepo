import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RpcProvider } from 'starknet';
import { SignatureDTO, UpdateSignatureDTO } from './dto/signature.dto';
import {
  NftCollections,
  NftCollectionStandard,
  NftCollectionStats,
  Nfts,
} from '@app/shared/models';
import {
  Signature,
  SignStatusEnum,
  TxStatusEnum,
} from '@app/shared/models/schemas/signature.schema';
import { RPC_PROVIDER } from '@app/shared/constants';
import { GetSignatureActivityQueryDTO } from './dto/getSignatureQuery';
import { BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { NftCollectionsService } from '../nft-collections/nftCollections.service';

@Injectable()
export class SignatureService {
  private provider?: RpcProvider;
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    @InjectModel(Nfts.name) private nftModel: Model<Nfts>,
    @InjectModel(NftCollections.name)
    private collectionModel: Model<NftCollections>,
    @InjectModel(Signature.name) private signatureModel: Model<Signature>,
    @InjectModel(NftCollectionStats.name)
    private collectionStatsModel: Model<NftCollectionStats>,
    private colelctionService: NftCollectionsService,
  ) {
    this.provider = new RpcProvider({
      nodeUrl:
        // 'https://starknet-mainnet.g.alchemy.com/v2/PDWMhHtyi3_RVgU1VbNwTfZ9MscJffDZ',
        RPC_PROVIDER.MAINNET,
    });
  }

  async createSignature(signature: SignatureDTO, signer: string) {
    try {
      const signExits = await this.signatureModel
        .findOne({
          contract_address: signature.contract_address,
          token_id: signature.token_id,
          signer: signer,
          status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
        })
        .exec();

      if (signExits) return;

      const nft = await this.nftModel
        .findOne({
          contract_address: signature.contract_address,
          token_id: signature.token_id,
        })
        .exec();

      const newSignature = new this.signatureModel({
        ...signature,
        transaction_status: TxStatusEnum.PENDING,
        nft: nft._id,
      });

      return newSignature.save();
    } catch (error) {
      throw new BadRequestException(error.message);
      console.log(error);
    }
  }

  async getSignature(
    contract_address: string,
    token_id: string,
  ): Promise<Signature> {
    try {
      const collection = await this.collectionModel.findOne({
        contract_address,
      });

      if (!collection) return;

      if (collection.standard == NftCollectionStandard.ERC721) {
        const signature = await this.signatureModel
          .findOne({
            contract_address,
            token_id,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .exec();

        return signature;
      } else {
        const signature = await this.signatureModel
          .find({
            contract_address,
            token_id,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .sort({ price: 1 })
          .limit(1)
          .exec();

        return signature[0];
      }
    } catch (error) {
      throw new BadRequestException(error.message);
      console.log(error);
    }
  }

  async getSignatureByOwner(
    contract_address: string,
    token_id: string,
    owner_address: string,
  ): Promise<Signature> {
    try {
      const collection = await this.collectionModel.findOne({
        contract_address,
      });

      if (!collection) return;

      if (collection.standard == NftCollectionStandard.ERC721) {
        const signature = await this.signatureModel
          .findOne({
            contract_address,
            token_id,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .exec();

        return signature;
      } else {
        const signature = await this.signatureModel
          .find({
            contract_address,
            token_id,
            signer: owner_address,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .sort({ price: 1 })
          .limit(1)
          .exec();

        if (signature.length === 0) {
          const sign = await this.signatureModel
            .findOne({
              contract_address,
              token_id,
              status: { $in: [SignStatusEnum.LISTING] },
            })
            .exec();
          return sign;
        }

        return signature[0];
      }
    } catch (error) {
      throw new BadRequestException(error.message);
      console.log(error);
    }
  }

  async getSignatures(
    contract_address: string,
    token_id: string,
  ): Promise<Signature[]> {
    try {
      const signature = await this.signatureModel
        .find({
          contract_address,
          token_id,
          status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
        })
        .exec();

      return signature;
    } catch (error) {
      throw new BadRequestException(error.message);
      console.log(error);
    }
  }

  async getBidSignatures(
    contract_address: string,
    token_id: string,
  ): Promise<Signature[]> {
    try {
      const signature = await this.signatureModel
        .find({
          contract_address,
          token_id,
          status: SignStatusEnum.BID,
        })
        .exec();

      return signature;
    } catch (error) {
      throw new BadRequestException(error.message);
      console.log(error);
    }
  }

  async updateSignature(updateSignatureDTO: UpdateSignatureDTO): Promise<void> {
    try {
      const { signature_id, transaction_hash, buyer_address, amount } =
        updateSignatureDTO;

      const signature = await this.signatureModel.findById(signature_id).exec();

      //   const schema = await this.collectionService.getSchema(
      //     signature.contract_address,
      //   );
      const collectionModel = await this.collectionModel
        .findOne({ contract_address: signature.contract_address })
        .exec();

      if (collectionModel.standard == NftCollectionStandard.ERC721) {
        await this.signatureModel.findByIdAndUpdate(signature_id, {
          status: SignStatusEnum.BUYING,
          transaction_hash: transaction_hash,
          buyer_address: buyer_address,
        });
      } else {
        if (amount == signature.amount) {
          await this.signatureModel.findByIdAndUpdate(signature_id, {
            status: SignStatusEnum.BUYING,
            transaction_hash: transaction_hash,
            buyer_address: buyer_address,
          });
        } else {
          await this.signatureModel.findByIdAndUpdate(signature_id, {
            amount: signature.amount - amount,
          });

          new this.signatureModel({
            ...signature.toObject(),
            _id: undefined, // Ensure a new ID is generated for the new document
            status: SignStatusEnum.BUYING,
            amount: amount,
            transaction_hash: transaction_hash,
            buyer_address: buyer_address,
          }).save();
        }
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateSignatureBid(
    updateSignatureDTO: UpdateSignatureDTO,
    signer: string,
  ): Promise<void> {
    try {
      const { signature_id, transaction_hash, amount } = updateSignatureDTO;

      const signature = await this.signatureModel
        .findOne({
          _id: signature_id,
          signer: signer,
        })
        .exec();

      const collectionModel = await this.collectionModel
        .findOne({ contract_address: signature.contract_address })
        .exec();

      if (collectionModel.standard == NftCollectionStandard.ERC721) {
        await this.signatureModel.findByIdAndUpdate(signature_id, {
          status: SignStatusEnum.BIDDING,
          transaction_hash: transaction_hash,
        });
      }
    } catch (error) {
      this.logger.log(`Error in Update Bid ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async syncTx() {
    try {
      const signatures = await this.signatureModel
        .find({
          status: { $in: [SignStatusEnum.BIDDING, SignStatusEnum.BUYING] },
        })
        .exec();

      if (signatures.length === 0) {
        return;
      }

      for (const signature of signatures) {
        if (!signature.transaction_hash) {
          console.log('No transaction hash');
          continue;
        }

        try {
          const res = await this.provider.getTransactionStatus(
            signature.transaction_hash,
          );
          this.logger.log('Synced tx status: ' + signature.transaction_hash);
          if (res.execution_status === 'REVERTED') {
            signature.status = SignStatusEnum.REVERTED;
            signature.transaction_status = TxStatusEnum.REVERTED;
            await signature.save();
            this.logger.log(
              'Synced tx status to REVERTED: ' + signature.transaction_hash,
            );
          } else {
            switch (res.finality_status) {
              case TxStatusEnum.ACCEPTED_ON_L1:

              case TxStatusEnum.ACCEPTED_ON_L2:
                signature.status = SignStatusEnum.SOLD;
                signature.transaction_status = res.finality_status.includes(
                  TxStatusEnum.ACCEPTED_ON_L2,
                )
                  ? TxStatusEnum.ACCEPTED_ON_L2
                  : TxStatusEnum.ACCEPTED_ON_L1;
                await signature.save();
                this.logger.log(
                  'Synced tx status to SOLD: ' + signature.transaction_hash,
                );

                const dataExist =
                  await this.colelctionService.getOrCreateNftCollectionStats(
                    signature.contract_address,
                  );
                const avgPrice = dataExist.floorPrice / dataExist.totalVolume;
                await this.collectionStatsModel.findOneAndUpdate(
                  {
                    contract_address: dataExist.nftContract,
                  },
                  {
                    $inc: {
                      floorPrice: avgPrice,
                    },
                  },
                );
                break;
            }
          }
        } catch (error) {
          this.logger.log('Synced tx status error: ' + error);
          continue;
        }
      }
    } catch (error) {
      this.logger.error("Can't sync tx status", error);
    }
  }

  async cancelSignature(signature_id: string, signer: string) {
    try {
      const res = await this.signatureModel
        .findOne(
          {
            _id: signature_id,
            signer: signer,
          },
          { status: SignStatusEnum.ORDER_CANCEL },
          { new: true },
        )
        .exec();

      return res;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getOrdersByAddress(address: string) {
    try {
      const signatures = await this.signatureModel
        .find({
          signer: address,
          status: SignStatusEnum.LISTING,
        })
        .populate('nftcollections')
        .exec();

      return signatures;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getBidByAddress(address: string) {
    try {
      const signatures = await this.signatureModel
        .find({
          signer: address,
          status: SignStatusEnum.BID,
        })
        .populate('nftcollections')
        .exec();

      return signatures;
    } catch (error) {
      this.logger.error(error);
    }
  }

  addCurrencyToAllDocuments = async () => {
    try {
      // const result = await this.signatureModel.updateMany(
      //   { currency: { $exists: false } }, // Match documents where 'currency' field does not exist
      //   { $set: { currency: 'defaultCurrencyValue' } }, // Replace 'defaultCurrencyValue' with the actual default value you want to set
      // );

      const result = await this.signatureModel.ensureIndexes();

      console.log('Documents updated:', result);
    } catch (error) {
      console.error('Error updating documents:', error);
    }
  };

  async getNFTActivity(query: GetSignatureActivityQueryDTO) {
    const {
      contract_address,
      sortPrice,
      minPrice,
      maxPrice,
      status,
      page,
      size,
    } = query;

    const filter: any = {};
    const result = new BaseResultPagination<any>();
    if (contract_address) {
      filter.contract_address = query.contract_address;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }
    if (status) {
      filter.status = query.status;
    }

    let sortQuery = {};
    switch (sortPrice) {
      case 'asc':
        sortQuery = { price: 1, updatedAt: -1 };
        break;
      case 'desc':
        sortQuery = { price: -1, updatedAt: -1 };
        break;
      default:
        sortQuery = { updatedAt: -1 };
    }

    const total = await this.signatureModel.countDocuments(filter);
    const dataItems = await this.signatureModel
      .find(filter)
      .sort(sortQuery)
      .skip(page)
      .limit(size)
      .populate(['nft'])
      .exec();

    // console.log('dataItems', dataItems);
    result.data = new PaginationDto(dataItems, total, page, size);
    // console.log('dataItems', dataItems);
    // try {
    //   const agg = [
    //     {
    //       $match: {
    //         ...(contract_address != '' && {
    //           contract_address: contract_address,
    //         }),
    //         price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
    //         ...(status === 'LISTED'
    //           ? { status: 'LISTING' }
    //           : { status: { $ne: 'ORDER_CANCEL' } }),
    //       },
    //     },
    //     {
    //       $sort: sortQuery,
    //     },
    //     {
    //       $lookup: {
    //         from: 'nftcollections', // Tên của bộ sưu tập NFT
    //         localField: 'nft', // Trường từ các tài liệu đầu vào trong giai đoạn $lookup
    //         foreignField: '_id', // Trường từ các tài liệu trong bộ sưu tập "from"
    //         as: 'nft', // Trường mảng thêm vào các tài liệu đầu vào chứa các tài liệu khớp từ bộ sưu tập "from"
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: '$nft',
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     {
    //       $skip: (page - 1) * size,
    //     },
    //     {
    //       $limit: size,
    //     },
    //   ];

    //   const nfts = await this.signatureModel.aggregate(agg);

    //   const totalDocuments = await this.signatureModel.countDocuments().exec();

    //   const totalPages = Math.ceil(totalDocuments / size);

    //   let nextPage = Number(page) + 1;

    //   if (nextPage > 10) nextPage = -1;

    //   return { data: nfts, totalPages: totalPages, nextPage: nextPage };
    // } catch (error) {
    //   this.logger.error(error);
    // }
    console.log('Data', result);
    return result;
  }

  async getNftCollectionActivity(query: GetSignatureActivityQueryDTO) {
    const {
      contract_address,
      sortPrice = 'desc', // default descending
      minPrice,
      maxPrice,
      status,
      page,
      size,
    } = query;
    const result = new BaseResultPagination<any>();
    const skip = (page - 1) * size;
    const limit = size;

    const matchConditions: any = {}; // Dynamically build match conditions

    if (contract_address) {
      matchConditions.contract_address = contract_address;
    }

    if (minPrice || maxPrice) {
      matchConditions.price = {};
      if (minPrice) matchConditions.price.$gte = Number(minPrice);
      if (maxPrice) matchConditions.price.$lte = Number(maxPrice);
    }

    if (status) {
      matchConditions.status = status;
    }

    const activities = await this.signatureModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'nfts',
          localField: 'nft',
          foreignField: '_id',
          as: 'nftDetails',
        },
      },
      { $unwind: { path: '$nftDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'nftcollections',
          localField: 'nftDetails.nftContract',
          foreignField: 'nftContract',
          as: 'collectionDetails',
        },
      },
      {
        $unwind: {
          path: '$collectionDetails',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          contract_address: { $ne: null }, // Exclude documents with null contract_address
          'collectionDetails.name': { $ne: null }, // Exclude documents with null collection name
        },
      },
      {
        $group: {
          _id: '$contract_address',
          name: { $first: '$collectionDetails.name' },
          avatar: { $first: '$collectionDetails.avatar' },
          cover: { $first: '$collectionDetails.cover' },
          symbol: { $first: '$collectionDetails.symbol' },
          activities: {
            $push: {
              contract_address: '$contract_address',
              name: '$name',
              token_id: '$token_id',
              price: '$price',
              amount: '$amount',
              status: '$status',
              buyer_address: '$buyer_address',
              transaction_hash: '$transaction_hash',
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $addFields: {
          activities: { $slice: ['$activities', 10] }, // Limit activities to 10
        },
      },
      {
        $project: {
          _id: 0, // Exclude MongoDB default `_id`
          contract_address: '$_id',
          name: 1,
          avatar: 1,
          cover: 1,
          symbol: 1,
          activities: 1,
        },
      },
      { $sort: { 'activities.createdAt': sortPrice === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Total count for meta information
    const total = await this.signatureModel.countDocuments(matchConditions);
    result.data = new PaginationDto(activities, total, page, size);
    return result;
  }

  //todo Hide
  async updateAllSignature() {
    try {
      const signatures = await this.signatureModel.find().exec();
      for (const signature of signatures) {
        const nft = await this.nftModel
          .findOne({
            nftContract: signature.contract_address,
            tokenId: signature.token_id,
          })
          .exec();
        if (nft) {
          await this.signatureModel
            .findByIdAndUpdate(signature._id, {
              nft: nft._id,
            })
            .exec();
          console.log('Updated Signature', nft._id);
        }
      }
    } catch (error) {
      console.log('Error When Update Signature', error);
    }
  }
}
