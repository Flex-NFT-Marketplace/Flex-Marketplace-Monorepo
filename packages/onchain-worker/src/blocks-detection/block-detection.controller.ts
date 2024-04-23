import { Controller } from '@nestjs/common';
import { BlockDetectionService } from './block-detection.service';
import { NftItemService } from './nft-item.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlockDocument,
  Blocks,
  ChainDocument,
  Chains,
} from '@app/shared/models';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3-service/web3.service';

@Controller('block-detection')
export class BlockDetectionController {
  constructor(
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    @InjectModel(Blocks.name)
    private readonly blockModel: Model<BlockDocument>,
    private readonly nftItemService: NftItemService,
    private readonly web3Service: Web3Service,
  ) {
    if (!this.listeners) this.init();
  }
  listeners: BlockDetectionService[];

  async init() {
    const chains = await this.chainModel.find();
    this.listeners = chains
      .filter(chain => chain.marketplaceContract)
      .map(
        chain =>
          new BlockDetectionService(
            this.blockModel,
            this.web3Service,
            chain,
            this.nftItemService,
          ),
      );

    for (const job of this.listeners) {
      job.start();
    }
  }
}
