import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from './base.schema';

export type ChainDocument = Chains & Document;

@Schema({
  timestamps: true,
})
export class Chains extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  rpc: string;

  @Prop()
  explorer: string;

  @Prop()
  deployerContract: string;

  @Prop()
  marketplaceContract: string[];

  @Prop()
  pyramidContract: string;

  @Prop()
  elementContract: string;

  @Prop()
  unframedContract: string;

  @Prop()
  currentMarketplaceContract: string;

  @Prop()
  royaltyManagerContract: string;

  @Prop()
  royaltyRegistryContract: string;

  @Prop()
  currencyManagerContract: string;

  @Prop()
  executeManagerContract: string;

  @Prop()
  signatureCheckerContract: string;

  @Prop()
  strategyForAnyItemFromCollectionFixedPrice?: string;

  @Prop()
  strategyHighestBidder?: string;

  @Prop()
  strategyPrivateSale?: string;

  @Prop()
  strategyStandardSaleForFixedPrice?: string;

  @Prop()
  transferManagerERC721?: string;

  @Prop()
  transferManagerERC1155?: string;

  @Prop()
  transferSelectorNFT?: string;

  @Prop()
  flexDropContracts?: string[];

  @Prop()
  erc721FlexDropClassHash?: string;

  @Prop()
  stakingContracts: string[];

  @Prop()
  delayBlock: number;
}

export const ChainSchema = SchemaFactory.createForClass(Chains);
