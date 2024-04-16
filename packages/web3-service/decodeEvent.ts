import { BigNumberish, Contract, ParsedStruct, Provider, num } from 'starknet';
import { formattedContractAddress } from '@app/shared/utils';
import { ABIS } from './types';

export type ContractDeployedReturnValue = {
  address: string;
  deployer: string;
};

export const decodeContractDeployed = (
  txReceipt: any,
  provider: Provider,
): ContractDeployedReturnValue => {
  const contractInstance = new Contract(
    ABIS.ContractDeployerABI,
    txReceipt.events[0].from_address,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const returnValue: ContractDeployedReturnValue = {
    address: formattedContractAddress(
      num.toHex(parsedEvent.ContractDeployed.address as BigNumberish),
    ),
    deployer: formattedContractAddress(
      num.toHex(parsedEvent.ContractDeployed.deployer as BigNumberish),
    ),
  };

  return returnValue;
};

export type ERC721TransferReturnValue = {
  from: string;
  to: string;
  tokenId: number;
  nftAddress: string;
  timestamp: number;
  isFlexDropMinted?: boolean;
  price?: number;
};

export const decodeERC721Transfer = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC721TransferReturnValue => {
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  const contractInstance = new Contract(ABIS.Erc721ABI, nftAddress, provider);

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const returnValue: ERC721TransferReturnValue = {
    from: formattedContractAddress(
      num.toHex(parsedEvent.Transfer.from as BigNumberish),
    ),
    to: formattedContractAddress(
      num.toHex(parsedEvent.Transfer.to as BigNumberish),
    ),
    tokenId: Number((parsedEvent.Transfer.token_id as bigint).toString()),
    nftAddress,
    timestamp,
  };

  return returnValue;
};

export type ERC1155TransferReturnValue = {
  from: string;
  to: string;
  tokenId: number;
  nftAddress: string;
  value: number;
  timestamp: number;
  isFlexDropMinted?: boolean;
  price?: number;
};

export const decodeERC115Transfer = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC1155TransferReturnValue => {
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  const contractInstance = new Contract(ABIS.Erc1155ABI, nftAddress, provider);

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const returnValue: ERC1155TransferReturnValue = {
    from: formattedContractAddress(
      num.toHex(parsedEvent.TransferSingle.from as BigNumberish),
    ),
    to: formattedContractAddress(
      num.toHex(parsedEvent.TransferSingle.to as BigNumberish),
    ),
    tokenId: Number((parsedEvent.TransferSingle.id as bigint).toString()),
    nftAddress,
    timestamp,
    value: Number((parsedEvent.TransferSingle.value as bigint).toString()),
  };

  return returnValue;
};

export const decodeERC115TransferBatch = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC1155TransferReturnValue[] => {
  const returnValues: ERC1155TransferReturnValue[] = [];
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  const contractInstance = new Contract(ABIS.Erc1155ABI, nftAddress, provider);

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const { from, to, ids, values } = parsedEvent.TransferBatch;
  const fromAddress = formattedContractAddress(num.toHex(from as BigNumberish));
  const toAddress = formattedContractAddress(num.toHex(to as BigNumberish));
  for (let i = 0; i < (ids as BigNumberish[]).length; i++) {
    returnValues.push({
      from: fromAddress,
      to: toAddress,
      tokenId: Number((ids[i] as bigint).toString()),
      nftAddress,
      timestamp,
      value: Number((values[i] as bigint).toString()),
    });
  }

  return returnValues;
};

export type CancelOrderReturnValue = {
  user: string;
  orderNonce: number;
  timestamp: number;
};

export const decodeCancelOrder = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): CancelOrderReturnValue => {
  const marketplaceAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.MarketplaceABI,
    marketplaceAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: CancelOrderReturnValue = {
    user: formattedContractAddress(
      num.toHex(parsedEvent.CancelOrder.user as BigNumberish),
    ),
    orderNonce: Number(
      (parsedEvent.CancelOrder.order_nonce as bigint).toString(),
    ),
    timestamp,
  };

  return retrunValue;
};

export type CancelAllOrdersReturnValue = {
  user: string;
  newMinNonce: number;
  timestamp: number;
};

export const decodeCancelAllOrders = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): CancelAllOrdersReturnValue => {
  const marketplaceAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.MarketplaceABI,
    marketplaceAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: CancelAllOrdersReturnValue = {
    user: formattedContractAddress(
      num.toHex(parsedEvent.CancelAllOrders.user as BigNumberish),
    ),
    newMinNonce: Number(
      (parsedEvent.CancelAllOrders.new_min_nonce as bigint).toString(),
    ),
    timestamp,
  };

  return retrunValue;
};

export type SaleReturnValue = {
  orderNonce: number;
  seller: string;
  buyer: string;
  currency: string;
  collection: string;
  tokenId: number;
  amount: number;
  price: number;
  timestamp: number;
};

export const decodeTakerBid = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): SaleReturnValue => {
  const marketplaceAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.MarketplaceABI,
    marketplaceAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: SaleReturnValue = {
    orderNonce: Number((parsedEvent.TakerBid.order_nonce as bigint).toString()),
    seller: formattedContractAddress(
      num.toHex(parsedEvent.TakerBid.maker as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex(parsedEvent.TakerBid.taker as BigNumberish),
    ),
    currency: formattedContractAddress(
      num.toHex(parsedEvent.TakerBid.currency as BigNumberish),
    ),
    collection: formattedContractAddress(
      num.toHex(parsedEvent.TakerBid.collection as BigNumberish),
    ),
    tokenId: Number((parsedEvent.TakerBid.token_id as bigint).toString()),
    amount: Number((parsedEvent.TakerBid.amount as bigint).toString()),
    price: Number((parsedEvent.TakerBid.price as bigint).toString()),
    timestamp,
  };

  return retrunValue;
};

export const decodeTakerAsk = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): SaleReturnValue => {
  const marketplaceAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.MarketplaceABI,
    marketplaceAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: SaleReturnValue = {
    orderNonce: Number((parsedEvent.TakerAsk.order_nonce as bigint).toString()),
    seller: formattedContractAddress(
      num.toHex(parsedEvent.TakerAsk.taker as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex(parsedEvent.TakerAsk.maker as BigNumberish),
    ),
    currency: formattedContractAddress(
      num.toHex(parsedEvent.TakerAsk.currency as BigNumberish),
    ),
    collection: formattedContractAddress(
      num.toHex(parsedEvent.TakerAsk.collection as BigNumberish),
    ),
    tokenId: Number((parsedEvent.TakerAsk.token_id as bigint).toString()),
    amount: Number((parsedEvent.TakerAsk.amount as bigint).toString()),
    price: Number((parsedEvent.TakerAsk.price as bigint).toString()),
    timestamp,
  };

  return retrunValue;
};

export type PhaseDropUpdatedReturnValue = {
  nftAddress: string;
  phaseDropId: number;
  mintPrice: number;
  currency: string;
  startTime: number;
  endTime: number;
  maxMintPerWallet: number;
  phaseType: number;
  timestamp: number;
};

export const decodePhaseDropUpdated = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
) => {
  const flexDropAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.FlexDropABI,
    flexDropAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const phaseDrop: ParsedStruct = parsedEvent.PhaseDropUpdated
    .phase_drop as ParsedStruct;
  const returnValue: PhaseDropUpdatedReturnValue = {
    nftAddress: formattedContractAddress(
      num.toHex(parsedEvent.PhaseDropUpdated.nft_address as BigNumberish),
    ),
    phaseDropId: Number(
      (parsedEvent.PhaseDropUpdated.phase_drop_id as bigint).toString(),
    ),
    mintPrice: Number((phaseDrop.mint_price as bigint).toString()) / 1e18,
    currency: formattedContractAddress(
      num.toHex(phaseDrop.currency as BigNumberish),
    ),
    startTime: Number((phaseDrop.start_time as bigint).toString()) * 1e3,
    endTime: Number((phaseDrop.end_time as bigint).toString()) * 1e3,
    maxMintPerWallet: Number(
      (phaseDrop.max_mint_per_wallet as bigint).toString(),
    ),
    phaseType: Number((phaseDrop.phase_type as bigint).toString()),
    timestamp,
  };
  return returnValue;
};

export type CreatorPayoutUpdatedReturnValue = {
  nftAddress: string;
  newPayoutAddress: string;
};

export const decodeCreatorPayoutUpdated = (
  txReceipt: any,
  provider: Provider,
) => {
  const flexDropAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.FlexDropABI,
    flexDropAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: CreatorPayoutUpdatedReturnValue = {
    nftAddress: formattedContractAddress(
      num.toHex(parsedEvent.CreatorPayoutUpdated.nft_address as BigNumberish),
    ),
    newPayoutAddress: formattedContractAddress(
      num.toHex(
        parsedEvent.CreatorPayoutUpdated.new_payout_address as BigNumberish,
      ),
    ),
  };

  return retrunValue;
};

export type PayerUpdatedReturnValue = {
  nftAddress: string;
  payer: string;
  allowed: boolean;
};

export const decodePayerUpdated = (
  txReceipt: any,
  provider: Provider,
): PayerUpdatedReturnValue => {
  const flexDropAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.FlexDropABI,
    flexDropAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: PayerUpdatedReturnValue = {
    nftAddress: formattedContractAddress(
      num.toHex(parsedEvent.PayerUpdated.nft_address as BigNumberish),
    ),
    payer: formattedContractAddress(
      num.toHex(parsedEvent.PayerUpdated.payer as BigNumberish),
    ),
    allowed: parsedEvent.PayerUpdated.allowed as any,
  };

  return retrunValue;
};

export type FlexDropMintedReturnValue = {
  nftAddress: string;
  minter: string;
  feeRecipient: string;
  payer: string;
  quantityMinted: number;
  totalMintPrice: number;
  feeMint: number;
  timestamp: number;
};

export const decodeFlexDropMinted = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): FlexDropMintedReturnValue => {
  const flexDropAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.FlexDropABI,
    flexDropAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const returnValue: FlexDropMintedReturnValue = {
    nftAddress: formattedContractAddress(
      num.toHex(parsedEvent.FlexDropMinted.nft_address as BigNumberish),
    ),
    minter: formattedContractAddress(
      num.toHex(parsedEvent.FlexDropMinted.minter as BigNumberish),
    ),
    feeRecipient: formattedContractAddress(
      num.toHex(parsedEvent.FlexDropMinted.fee_recipient as BigNumberish),
    ),
    payer: formattedContractAddress(
      num.toHex(parsedEvent.FlexDropMinted.payer as BigNumberish),
    ),
    quantityMinted: Number(
      (parsedEvent.FlexDropMinted.quantity_minted as bigint).toString(),
    ),
    totalMintPrice: Number(
      (parsedEvent.FlexDropMinted.total_mint_price as bigint).toString(),
    ),
    feeMint: Number((parsedEvent.FlexDropMinted.fee_mint as bigint).toString()),
    timestamp,
  };

  return returnValue;
};
