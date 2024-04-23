import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { NftCollectionDto, NftCollections } from '@app/shared/models';
import { Model } from 'mongoose';
import { NftCollectionQueryParams } from '@app/shared/modules/dtos-query';
import { PaginationDto } from '@app/shared/types/pagination.dto';
@Injectable()
export class NftCollectionsService {
  constructor(
    @InjectModel(NftCollections.name)
    private nftCollectionModel: Model<NftCollections>,
  ) {}
  async getListNFTCollections(
    query: NftCollectionQueryParams,
  ): Promise<PaginationDto<NftCollectionDto>> {
    const filter: any = {};
    if (query.standard) {
      filter.standard = query.standard;
    }
    if (query.nftContract) {
      filter.nftContract = query.nftContract;
    }
    const count = await this.nftCollectionModel.countDocuments(filter);
    const items = await this.nftCollectionModel
      .find(filter)
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    return new PaginationDto(items, count, query.page, query.size);
  }

  async getNFTCollectionDetail(nftContract: string) {
    const data = (
      await this.nftCollectionModel.findOne({ nftContract })
    ).populate(['paymentTokens']);
    return data;
  }
}
