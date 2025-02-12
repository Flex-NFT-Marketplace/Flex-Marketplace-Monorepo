import {
  Histories,
  HistoryDocument,
  HistoryDto,
  UserDocument,
  Users,
} from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryHistoriesDto } from './dtos/queryHistory.dto';
import { BaseResultPagination } from '@app/shared/types';
import { arraySliceProcess, formattedContractAddress } from '@app/shared/utils';
import { PaginationDto } from '@app/shared/types/pagination.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(Histories.name)
    private readonly historyModel: Model<HistoryDocument>,
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getHistories(
    params: QueryHistoriesDto,
  ): Promise<BaseResultPagination<HistoryDto>> {
    const result = new BaseResultPagination<HistoryDto>();
    const {
      size,
      skipIndex,
      sort,
      page,
      tokenId,
      nftContract,
      userAddress,
      types,
    } = params;

    const query: any = {};
    if (tokenId) query['$or'] = [{ tokenId }, { tokenId: Number(tokenId) }];
    if (nftContract) query.nftContract = nftContract;
    if (userAddress) {
      const userDocument = await this.userModel.findOne({
        address: formattedContractAddress(userAddress),
      });
      query.$or = [{ from: userDocument._id }, { to: userDocument._id }];
    }
    if (types && types.length > 0) query.type = { $in: types };

    const totalItem = await this.historyModel.countDocuments(query);

    if (size === 0) {
      result.data = new PaginationDto<HistoryDto>([], totalItem, page, size);
      return result;
    }

    const now = Date.now();
    const sortOperators = {};
    for (const items of sort) {
      sortOperators[Object.keys(items)[0]] = Object.values(items)[0];
    }
    const items = await this.historyModel
      .find(query)
      .sort(sortOperators)
      .skip(skipIndex)
      .limit(size)
      .populate([
        {
          path: 'from',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        {
          path: 'to',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'about',
            'socials',
            'isVerified',
          ],
        },
        'paymentToken',
      ]);
    await arraySliceProcess(items, async slicedItems => {
      await Promise.all(
        slicedItems.map(async item => {
          if (typeof item.tokenId === 'number') {
            item.tokenId = String(item.tokenId);
            await item.save();
          }
        }),
      );
    });

    result.data = new PaginationDto<HistoryDto>(items, totalItem, page, size);

    console.log(`${Date.now() - now} ms`);

    return result;
  }
}
