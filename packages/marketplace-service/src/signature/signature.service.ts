import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// import { StarkscanService } from 'src/starkscan/starkscan.service';
import { RpcProvider } from 'starknet';
import { SignatureDTO, UpdateSignatureDTO } from './dto/signature.dto';
import {
  NftCollections,
  NftCollectionStandard,
  Nfts,
} from '@app/shared/models';
import {
  Signature,
  SignStatusEnum,
  TxStatusEnum,
} from '@app/shared/models/schemas/signature.schema';
import { RPC_PROVIDER } from '@app/shared/constants';
import { GetSignatureActivityQueryDTO } from './dto/getSignatureQuery';

@Injectable()
export class SignatureService {
  private provider?: RpcProvider;
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    @InjectModel(Nfts.name) private nftModel: Model<Nfts>,
    @InjectModel(NftCollections.name)
    private collectionModel: Model<NftCollections>,
    @InjectModel(Signature.name) private signatureModel: Model<Signature>,
  ) {
    this.provider = new RpcProvider({
      nodeUrl:
        // 'https://starknet-mainnet.g.alchemy.com/v2/PDWMhHtyi3_RVgU1VbNwTfZ9MscJffDZ',
        RPC_PROVIDER.MAINNET,
    });
  }

  async createSignature(signature: SignatureDTO) {
    try {
      const signExits = await this.signatureModel
        .findOne({
          contract_address: signature.contract_address,
          token_id: signature.token_id,
          signer: signature.signer,
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
      console.log(error);
    }
  }

  async updateSignatureBid(
    updateSignatureDTO: UpdateSignatureDTO,
  ): Promise<void> {
    try {
      const { signature_id, transaction_hash, amount } = updateSignatureDTO;

      const signature = await this.signatureModel.findById(signature_id).exec();

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
      this.logger.error(error);
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

  async cancelSignature(signature_id: string) {
    try {
      const res = await this.signatureModel
        .findByIdAndUpdate(
          signature_id,
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
    let sortQuery = {};
    const {
      contract_address,
      sortPrice,
      minPrice,
      maxPrice,
      status,
      search,
      page,
      sort,
      size,
    } = query;

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
    const filter: any = {};
    if (query.contract_address) {
      filter.contract_address = query.contract_address;
    }
    if (query.minPrice) {
      filter.price = { $gte: Number(minPrice) };
    }
    if (query.maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }
    if (query.status) {
      filter.status = query.status;
    }

    const dataItems = await this.signatureModel.find(filter).sort(sort).exec();
    console.log('dataItems', dataItems);
    try {
      const agg = [
        {
          $match: {
            ...(contract_address != '' && {
              contract_address: contract_address,
            }),
            price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
            ...(status === 'LISTED'
              ? { status: 'LISTING' }
              : { status: { $ne: 'ORDER_CANCEL' } }),
          },
        },
        {
          $sort: sortQuery,
        },
        {
          $lookup: {
            from: 'nftcollections', // Tên của bộ sưu tập NFT
            localField: 'nft', // Trường từ các tài liệu đầu vào trong giai đoạn $lookup
            foreignField: '_id', // Trường từ các tài liệu trong bộ sưu tập "from"
            as: 'nft', // Trường mảng thêm vào các tài liệu đầu vào chứa các tài liệu khớp từ bộ sưu tập "from"
          },
        },
        {
          $unwind: {
            path: '$nft',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $skip: (page - 1) * size,
        },
        {
          $limit: size,
        },
      ];

      const nfts = await this.signatureModel.aggregate(agg);

      const totalDocuments = await this.signatureModel.countDocuments().exec();

      const totalPages = Math.ceil(totalDocuments / size);

      let nextPage = Number(page) + 1;

      if (nextPage > 10) nextPage = -1;

      return { data: nfts, totalPages: totalPages, nextPage: nextPage };
    } catch (error) {
      this.logger.error(error);
    }
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
