export enum MarketType {
  OnSale = 'OnSale',
  NotForSale = 'NotForSale',
  Canceled = 'Canceled',
}
export enum NftCollectionStatus {
  Active = 'active',
  DeActive = 'deActive',
}

export enum ContractStandard {
  ERC20 = 'ERC20',
  ERC721 = 'ERC-721',
  ERC1155 = 'ERC-1155',
}

export enum FlexHausRarity {
  Common = 'common',
  Rare = 'rare',
  Legendary = 'legendary',
  Ultimate = 'ultimate',
}

export enum FlexHausDropType {
  Free = 'free',
  Protected = 'protected',
}

export enum NotificationStatus {
  Seen = 'Seen',
  UnSeen = 'UnSeen',
}

export enum HistoryType {
  Mint = 'mint',
  FlexDropMint = 'flexDropMint',
  WarpcastMint = 'warpcastMint',
  Transfer = 'transfer',
  CancelSale = 'cancelSale',
  CancelOffer = 'cancelOffer',
  Sale = 'sale',
  Burn = 'burn',
  Stake = 'stake',
  Unstake = 'unstake',
  ClaimCollectible = 'claimCollectible',
  BuyPoint = 'buyPoint',
  SecureCollectible = 'secureCollectible',
  ThankToCreator = 'thankToCreator',
}
export enum ActivityType {
  CreateSale = 'createSale',
  MakeOffer = 'makeOffer',
  UpdatePrice = 'updatePrice',
  Sale = 'sale',
}
export enum SpanMsType {
  OneDay = 86400000,
  OneWeek = 604800000,
  OneMonth = 2592000000,
}
export enum MarketStatus {
  OnSale = 'onSale',
  Sold = 'sold',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum OfferStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Cancelled = 'cancelled',
  Expired = 'expired',
}

export enum CategoryType {
  Art = 'Art',
  DomainNames = 'DomainNames',
  Gaming = 'Gaming',
  Memberships = 'Memberships',
  Music = 'Music',
  PFPs = 'PFPs',
  Photography = 'Photography',
  SportsCollectibles = 'SportsCollectibles',
  VirtualWorlds = 'VirtualWorlds',
  NoCategory = 'NoCategory',
}

export enum FileType {
  Avatar = 'Avatar',
  Cover = 'Cover',
  FeaturedImage = 'FeaturedImage',
}

export enum BlacklistType {
  Yellow = 1,
  Red = 2,
}

export const MAX_END_TIME_MS = 2592000000;

export type Attribute = {
  trait_type: string;
  value: any;
  display_type?: string;
};

export type AttributeMap = {
  label: string;
  trait_type: string;
  type: AttributesMapType;
  min?: number;
  max?: number;
  options?: any[];
};

export enum AttributesMapType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
}

export const BURN_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const SEQUENCER_ADDRESS =
  '0x01176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8';

export enum TokenType {
  ETH = 'ETH',
  STRK = 'STRK',
}
