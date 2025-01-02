import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RpcProvider } from 'starknet';
import { SignatureDTO, UpdateSignatureDTO } from './dto/signature.dto';
import {
  MarketType,
  NftCollections,
  NftCollectionStandard,
  NftCollectionStats,
  Nfts,
  PaymentTokenDocument,
  PaymentTokens,
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
import { formattedContractAddress } from '@app/shared/utils';

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
    @InjectModel(PaymentTokens.name)
    private paymentTokenModel: Model<PaymentTokenDocument>,
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
          contract_address: formattedContractAddress(signature.nftContract),
          token_id: signature.tokenId,
          signer: signer,
          status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
        })
        .exec();

      if (signExits) return;

      const nft = await this.nftModel
        .findOne({
          nftContract: formattedContractAddress(signature.nftContract),
          tokenId: signature.tokenId,
        })
        .exec();

      if (!nft) {
        throw new BadRequestException('Nft not found');
      }

      const paymentTokenDocument = await this.paymentTokenModel
        .findOne({
          contractAddress: formattedContractAddress(signature.currency),
        })
        .exec();

      if (!paymentTokenDocument) {
        throw new BadRequestException('Payment Token not allowed');
      }

      const signatureArray = JSON.parse(signature.signature4);

      if (signatureArray.length > 1) {
        signatureArray[1] = formattedContractAddress(signatureArray[1]);
      }
      if (signatureArray.length > 2) {
        signatureArray[2] = formattedContractAddress(signatureArray[2]);
      }
      const newSignature = new this.signatureModel({
        ...signature,
        contract_address: formattedContractAddress(signature.nftContract),
        token_id: signature.tokenId,
        signer: formattedContractAddress(signer),
        amount_sig: signature.amountSig,
        signature4: JSON.stringify(signatureArray),
        transaction_status: TxStatusEnum.PENDING,
        transaction_hash: signature.transactionHash,
        buyer_address:
          !signature.buyerAddress || signature.buyerAddress === ''
            ? ''
            : formattedContractAddress(signature.buyerAddress),
        sell_end: signature.sellEnd,
        nft: nft._id,
      });

      nft.price = signature.price;
      nft.paymentToken = paymentTokenDocument;
      nft.marketType = MarketType.OnSale;
      await nft.save();
      await newSignature.save();

      return await this.signatureModel
        .findById(newSignature._id, {
          _id: 1,
          nftContract: '$contract_address',
          tokenId: '$token_id',
          signature4: 1,
          nonce: 1,
          price: 1,
          amount: 1,
          amountSig: '$amount_sig',
          status: 1,
          transactionHash: '$transaction_hash',
          transactionStatus: '$transaction_status',
          sellEnd: '$sell_end',
          signer: 1,
          buyerAddress: '$buyer_address',
          currency: 1,
          nft: 1,
        })
        .populate([
          {
            path: 'nft',
            select: ['nftContract', 'tokenId', 'name', 'image', 'owner'],
          },
        ])
        .exec();
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getSignature(
    contract_address: string,
    token_id: string,
  ): Promise<Signature> {
    try {
      const collection = await this.collectionModel.findOne({
        nftContract: formattedContractAddress(contract_address),
      });

      if (!collection) return;

      const signature = await this.signatureModel.aggregate([
        {
          $match: {
            contract_address: formattedContractAddress(contract_address),
            token_id,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          },
        },
        {
          $sort: {
            price: -1,
            updatedAt: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: 'nfts',
            let: {
              contract_address: '$contract_address',
              token_id: '$token_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$contract_address', '$nftContract'] },
                      {
                        $or: [
                          { $eq: ['$$token_id', '$tokenId'] },
                          { $eq: [Number('$$token_id'), '$tokenId'] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  nftContract: 1,
                  tokenId: 1,
                  name: 1,
                  description: 1,
                  image: 1,
                  owner: 1,
                },
              },
            ],
            as: 'nft',
          },
        },
        { $unwind: '$nft' },
        {
          $project: {
            _id: 1,
            nftContract: '$contract_address',
            tokenId: '$token_id',
            signature4: 1,
            nonce: 1,
            price: 1,
            amount: 1,
            amountSig: '$amount_sig',
            status: 1,
            transactionHash: '$transaction_hash',
            transactionStatus: '$transaction_status',
            sellEnd: '$sell_end',
            signer: 1,
            buyerAddress: '$buyer_address',
            currency: 1,
            nft: 1,
          },
        },
      ]);

      return signature[0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getSignatureByOwner(
    contract_address: string,
    token_id: string,
    owner_address: string,
  ): Promise<Signature> {
    try {
      const collection = await this.collectionModel.findOne({
        nftContract: formattedContractAddress(contract_address),
      });

      if (!collection) return;

      if (collection.standard == NftCollectionStandard.ERC721) {
        const signature = await this.signatureModel
          .findOne({
            contract_address: formattedContractAddress(contract_address),
            token_id,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .sort({
            updatedAt: -1,
          })
          .exec();

        return signature;
      } else {
        const signature = await this.signatureModel
          .find({
            contract_address: formattedContractAddress(contract_address),
            token_id,
            signer: owner_address,
            status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
          })
          .sort({ price: 1, updatedAt: -1 })
          .limit(1)
          .exec();

        if (signature.length === 0) {
          const sign = await this.signatureModel
            .findOne({
              contract_address: formattedContractAddress(contract_address),
              token_id,
              status: { $in: [SignStatusEnum.LISTING] },
            })
            .sort({
              updatedAt: -1,
            })
            .exec();
          return sign;
        }

        return signature[0];
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getSignatures(
    contract_address: string,
    token_id: string,
  ): Promise<Signature[]> {
    try {
      const signature = await this.signatureModel
        .find({
          contract_address: formattedContractAddress(contract_address),
          token_id,
          status: { $in: [SignStatusEnum.LISTING, SignStatusEnum.BUYING] },
        })
        .sort({
          updatedAt: -1,
        })
        .exec();

      return signature;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBidSignatures(
    contract_address: string,
    token_id: string,
  ): Promise<Signature[]> {
    try {
      const signature = await this.signatureModel.aggregate([
        {
          $match: {
            contract_address: formattedContractAddress(contract_address),
            token_id,
            status: SignStatusEnum.BID,
          },
        },
        {
          $sort: {
            price: -1,
            updatedAt: -1,
          },
        },
        {
          $lookup: {
            from: 'nfts',
            let: {
              contract_address: '$contract_address',
              token_id: '$token_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$contract_address', '$nftContract'] },
                      {
                        $or: [
                          { $eq: ['$$token_id', '$tokenId'] },
                          { $eq: [Number('$$token_id'), '$tokenId'] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  nftContract: 1,
                  tokenId: 1,
                  name: 1,
                  description: 1,
                  image: 1,
                  owner: 1,
                },
              },
            ],
            as: 'nft',
          },
        },
        { $unwind: '$nft' },
        {
          $project: {
            _id: 1,
            nftContract: '$contract_address',
            tokenId: '$token_id',
            signature4: 1,
            nonce: 1,
            price: 1,
            amount: 1,
            amountSig: '$amount_sig',
            status: 1,
            transactionHash: '$transaction_hash',
            transactionStatus: '$transaction_status',
            sellEnd: '$sell_end',
            signer: 1,
            buyerAddress: '$buyer_address',
            currency: 1,
            nft: 1,
          },
        },
      ]);

      return signature;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateSignature(updateSignatureDTO: UpdateSignatureDTO): Promise<void> {
    const {
      signatureId: signature_id,
      transactionHash: transaction_hash,
      buyerAddress: buyer_address,
      amount,
    } = updateSignatureDTO;

    const signature = await this.signatureModel.findById(signature_id).exec();

    //   const schema = await this.collectionService.getSchema(
    //     signature.contract_address,
    //   );
    const collectionModel = await this.collectionModel
      .findOne({ nftContract: signature.contract_address })
      .exec();

    if (collectionModel.standard == NftCollectionStandard.ERC721) {
      await this.signatureModel.findByIdAndUpdate(signature_id, {
        status: SignStatusEnum.BUYING,
        transaction_hash: transaction_hash,
        buyer_address: formattedContractAddress(buyer_address),
      });
    } else {
      if (amount == signature.amount) {
        await this.signatureModel.findByIdAndUpdate(signature_id, {
          status: SignStatusEnum.BUYING,
          transaction_hash: transaction_hash,
          buyer_address: formattedContractAddress(buyer_address),
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
          buyer_address: formattedContractAddress(buyer_address),
        }).save();
      }
    }
  }

  // Bidding
  async updateSignatureBid(
    updateSignatureDTO: UpdateSignatureDTO,
    signer: string,
  ): Promise<void> {
    const {
      signatureId: signature_id,
      transactionHash: transaction_hash,
      amount,
    } = updateSignatureDTO;

    const signature = await this.signatureModel.findById(signature_id).exec();

    if (!signature) {
      throw new BadRequestException('Signature not found');
    }
    console.log('Signature Data', signature.signer, '///', signer);

    if (formattedContractAddress(signature.buyer_address) !== signer) {
      throw new BadRequestException('Can not bid this signature');
    }
    const collectionModel = await this.collectionModel
      .findOne({ nftContract: signature.contract_address })
      .exec();

    if (collectionModel.standard == NftCollectionStandard.ERC721) {
      console.log('updateSignatureBid -> signature_id', signature_id);
      await this.signatureModel
        .findByIdAndUpdate(signature_id, {
          $set: {
            status: SignStatusEnum.BIDDING,
            transaction_hash: transaction_hash,
          },
        })
        .exec();
    } else {
      if (amount == signature.amount) {
        await this.signatureModel
          .findByIdAndUpdate(signature_id, {
            $set: {
              status: SignStatusEnum.BIDDING,
              transaction_hash: transaction_hash,
            },
          })
          .exec();
      }
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

        const nft = await this.nftModel
          .findOne({
            nftContract: signature.contract_address,
            tokenId: signature.token_id,
          })
          .exec();

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
                await this.signatureModel
                  .updateMany(
                    {
                      _id: { $ne: signature.id },
                      token_id: signature.token_id,
                      contract_address: signature.contract_address,
                      status: SignStatusEnum.BID,
                    },
                    {
                      status: SignStatusEnum.ORDER_CANCEL,
                    },
                  )
                  .exec();

                await this.collectionStatsModel
                  .findOneAndUpdate(
                    {
                      nftContract: dataExist.nftContract,
                    },
                    {
                      $inc: {
                        floorPrice: avgPrice,
                      },
                    },
                  )
                  .exec();
                break;
            }
          }

          nft.price = 0;
          nft.paymentToken = null;
          nft.marketType = MarketType.NotForSale;
          await nft.save();
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
      const exist = await this.signatureModel.findById(signature_id).exec();
      if (!exist) {
        throw new BadRequestException('Signature not found');
      }

      if (formattedContractAddress(exist.signer) !== signer) {
        throw new BadRequestException('This Signature not belong to you');
      }

      const nft = await this.nftModel
        .findOne({
          nftContract: exist.contract_address,
          tokenId: exist.token_id,
        })
        .exec();

      nft.price = 0;
      nft.paymentToken = null;
      nft.marketType = MarketType.NotForSale;
      await nft.save();

      const res = await this.signatureModel
        .findByIdAndUpdate(
          {
            _id: signature_id,
          },
          { status: SignStatusEnum.ORDER_CANCEL },
          { new: true },
        )
        .exec();
      console.log('Cancel Signature', res);
      return res;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async getOrdersByAddress(address: string) {
    try {
      const formatAdress = formattedContractAddress(address);
      const signatures = await this.signatureModel
        .find({
          signer: formatAdress,
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
      const formatAdress = formattedContractAddress(address);
      const signatures = await this.signatureModel
        .find({
          signer: formatAdress,
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
      nftContract,
      sortPrice,
      minPrice,
      maxPrice,
      status,
      page,
      tokenId,
      size,
    } = query;
    console.log('What Rogn', query);
    const filter: any = {};
    const result = new BaseResultPagination<any>();
    if (nftContract) {
      filter.contract_address = formattedContractAddress(nftContract);
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
    if (tokenId) {
      filter.token_id = tokenId;
    }
    if (!status) {
      filter.status = {
        $in: [
          SignStatusEnum.SOLD,
          SignStatusEnum.BID,
          SignStatusEnum.BIDDING,
          SignStatusEnum.LISTING,
          SignStatusEnum.BUYING,
        ],
      };
    }

    let sortQuery = {};
    switch (sortPrice) {
      case 'asc':
        sortQuery = { price: 1, createdAt: -1 };
        break;
      case 'desc':
        sortQuery = { price: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { price: 1, createdAt: -1 };
    }

    const total = await this.signatureModel.countDocuments(filter);
    const dataItems = await this.signatureModel.aggregate([
      {
        $match: filter,
      },
      {
        $sort: sortQuery,
      },
      {
        $skip: (page - 1) * size,
      },
      {
        $limit: size,
      },
      {
        $lookup: {
          from: 'nfts',
          let: { contract_address: '$contract_address', token_id: '$token_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$contract_address', '$nftContract'] },
                    {
                      $or: [
                        { $eq: ['$$token_id', '$tokenId'] },
                        { $eq: [Number('$$token_id'), '$tokenId'] },
                      ],
                    },
                  ],
                },
              },
            },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                nftContract: 1,
                tokenId: 1,
                name: 1,
                image: 1,
                owner: 1,
              },
            },
          ],
          as: 'nft',
        },
      },
      { $unwind: '$nft' },
      {
        $project: {
          _id: 1,
          nftContract: '$contract_address',
          tokenId: '$token_id',
          signature4: 1,
          nonce: 1,
          price: 1,
          amount: 1,
          amountSig: '$amount_sig',
          status: 1,
          transactionHash: '$transaction_hash',
          transactionStatus: '$transaction_status',
          sellEnd: '$sell_end',
          signer: 1,
          buyerAddress: '$buyer_address',
          currency: 1,
          nft: 1,
        },
      },
    ]);

    result.data = new PaginationDto(dataItems, total, page, size);

    return result;
  }

  async getNftCollectionActivity(query: GetSignatureActivityQueryDTO) {
    const {
      nftContract,
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

    if (nftContract) {
      matchConditions.contract_address = formattedContractAddress(nftContract);
    }

    if (minPrice || maxPrice) {
      matchConditions.price = {};
      if (minPrice) matchConditions.price.$gte = Number(minPrice);
      if (maxPrice) matchConditions.price.$lte = Number(maxPrice);
    }

    if (status) {
      matchConditions.status = status;
    }

    let sortQuery = {};
    switch (sortPrice) {
      case 'asc':
        sortQuery = { price: 1, createdAt: -1 };
        break;
      case 'desc':
        sortQuery = { price: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { price: 1, createdAt: -1 };
    }

    const activities = await this.signatureModel.aggregate([
      { $match: matchConditions },
      { $sort: sortQuery },
      { $skip: (page - 1) * size },
      { $limit: size },
      {
        $lookup: {
          from: 'nfts',
          let: { contract_address: '$contract_address', token_id: '$token_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$contract_address', '$nftContract'] },
                    {
                      $or: [
                        { $eq: ['$$token_id', '$tokenId'] },
                        { $eq: [Number('$$token_id'), '$tokenId'] },
                      ],
                    },
                  ],
                },
              },
            },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                nftContract: 1,
                tokenId: 1,
                name: 1,
                description: 1,
                image: 1,
                owner: 1,
              },
            },
          ],
          as: 'nft',
        },
      },
      { $unwind: '$nft' },
      {
        $project: {
          _id: 1,
          nftContract: '$contract_address',
          tokenId: '$token_id',
          signature4: 1,
          nonce: 1,
          price: 1,
          amount: 1,
          amountSig: '$amount_sig',
          status: 1,
          transactionHash: '$transaction_hash',
          transactionStatus: '$transaction_status',
          sellEnd: '$sell_end',
          signer: 1,
          buyerAddress: '$buyer_address',
          currency: 1,
          nft: 1,
        },
      },
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
