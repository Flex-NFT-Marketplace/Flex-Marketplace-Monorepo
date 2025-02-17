import { ChainDocument, Chains } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PointPriceDto } from './dto/pointPrice.dto';
import { formatUnits } from 'ethers';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(Chains.name) private chainsModel: Model<ChainDocument>,
  ) {}

  async getPointPrice() {
    const chain = await this.chainsModel.findOne({ chainId: 1 });
    const pointPrice: PointPriceDto = {
      strkPerPoint: formatUnits(chain.strkPerPoint, 18),
      ethPerPoint: formatUnits(chain.ethPerPoint, 18),
    };
    return pointPrice;
  }
}
