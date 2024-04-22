import { InjectModel } from '@nestjs/mongoose';
import { NftDocument, NftDto, Nfts } from '@app/shared/models';
import { NftFilterQueryParams } from '@app/shared/modules/dtos-query';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
@Injectable()
export class NftService {
  constructor(
    @InjectModel(Nfts.name)
    private readonly nftModel: Model<NftDocument>,
  ) {}

  async getNftsByOwner(
    query: NftFilterQueryParams,
  ): Promise<PaginationDto<NftDto>> {
    const filter: any = {};
    if (query.owner) {
      filter.owner = query.owner;
    }
    if (query.nftContract) {
      filter.nftContract = query.nftContract;
    }
    if (query.tokenId) {
      filter.tokenId = query.tokenId;
    }

    const count = await this.nftModel.countDocuments(filter);
    console.log('Current Count', count);
    const items = await this.nftModel
      .find(filter)
      .sort(query.sort)
      .skip(query.skipIndex)
      .limit(query.size)
      .populate(['owner', 'nftCollection'])
      .exec();

    return new PaginationDto(items, count, query.page, query.size);
  }
}
