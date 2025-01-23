import {
  BigNumberish,
  Contract,
  ParsedStruct,
  Provider,
  num,
  uint256,
} from 'starknet';
import {
  convertDataIntoString,
  formattedContractAddress,
} from '@app/shared/utils';
import { ABIS, EventTopic } from './types';
import * as web3 from 'web3';

export type ContractDeployedReturnValue = {
  address: string;
  deployer: string;
  isFlexHausCollectible: boolean;
  drop_amount?: number;
  rarity?: string;
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
    isFlexHausCollectible: false,
  };

  return returnValue;
};

export type UpgradedContractReturnValue = {
  nftAddress: string;
  implementation: string;
};

export const decodeUpgradedContract = (txReceipt: any, provider: Provider) => {
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  const contractInstance = new Contract(ABIS.ProxyABI, nftAddress, provider);

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const returnValue: UpgradedContractReturnValue = {
    nftAddress,
    implementation: formattedContractAddress(
      num.toHex(parsedEvent.Upgraded.implementation as BigNumberish),
    ),
  };

  return returnValue;
};

export type ERC721OrERC20TransferReturnValue = {
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  timestamp: number;
  isKnownAsErc721: boolean;
  isFlexDropMinted?: boolean;
  isWarpcastMinted?: boolean;
  isClaimCollectible?: boolean;
  price?: number;
  phaseId?: number;
};

export const decodeERC721OrERC20Transfer = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC721OrERC20TransferReturnValue => {
  const contractAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );

  try {
    const contractInstance = new Contract(
      ABIS.Erc20ABI,
      contractAddress,
      provider,
    );
    const parsedEvent = contractInstance.parseEvents(txReceipt)[0];

    const returnValue: ERC721OrERC20TransferReturnValue = {
      from: formattedContractAddress(
        num.toHex(parsedEvent.Transfer.from as BigNumberish),
      ),
      to: formattedContractAddress(
        num.toHex(parsedEvent.Transfer.to as BigNumberish),
      ),
      value: (parsedEvent.Transfer.value as bigint).toString(),
      contractAddress: contractAddress,
      timestamp,
      isKnownAsErc721: false,
    };

    return returnValue;
  } catch (error) {
    try {
      const Erc721ContractInstance = new Contract(
        ABIS.Erc721ABI,
        contractAddress,
        provider,
      );
      txReceipt.events[0].keys.unshift(EventTopic.TRANSFER);
      const parsedEvent = Erc721ContractInstance.parseEvents(txReceipt)[0];
      const returnValue: ERC721OrERC20TransferReturnValue = {
        from: formattedContractAddress(
          num.toHex(parsedEvent.Transfer.from as BigNumberish),
        ),
        to: formattedContractAddress(
          num.toHex(parsedEvent.Transfer.to as BigNumberish),
        ),
        value: (parsedEvent.Transfer.token_id as bigint).toString(),
        contractAddress,
        timestamp,
        isKnownAsErc721: true,
      };
      return returnValue;
    } catch (error) {
      try {
        const oldVercontractInstance = new Contract(
          ABIS.OldErc721ABI,
          contractAddress,
          provider,
        );
        txReceipt.events[0].keys.unshift(EventTopic.TRANSFER);
        const parsedEvent = oldVercontractInstance.parseEvents(txReceipt)[0];
        const returnValue: ERC721OrERC20TransferReturnValue = {
          from: formattedContractAddress(
            num.toHex(parsedEvent.Transfer.from as BigNumberish),
          ),
          to: formattedContractAddress(
            num.toHex(parsedEvent.Transfer.to as BigNumberish),
          ),
          value: (
            uint256.uint256ToBN(parsedEvent.Transfer.token_id as any) as bigint
          ).toString(),
          contractAddress,
          timestamp,
          isKnownAsErc721: true,
        };

        return returnValue;
      } catch (error) {
        return null;
      }
    }
  }
};

export type ERC1155TransferReturnValue = {
  from: string;
  to: string;
  tokenId: string;
  nftAddress: string;
  value: number;
  timestamp: number;
  isFlexDropMinted?: boolean;
  isWarpcastMinted?: boolean;
  price?: number;
  phaseId?: number;
};

export const decodeERC115Transfer = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC1155TransferReturnValue => {
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  try {
    const contractInstance = new Contract(
      ABIS.Erc1155ABI,
      nftAddress,
      provider,
    );

    const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
    const returnValue: ERC1155TransferReturnValue = {
      from: formattedContractAddress(
        num.toHex(parsedEvent.TransferSingle.from as BigNumberish),
      ),
      to: formattedContractAddress(
        num.toHex(parsedEvent.TransferSingle.to as BigNumberish),
      ),
      tokenId: (parsedEvent.TransferSingle.id as bigint).toString(),
      nftAddress,
      timestamp,
      value: Number((parsedEvent.TransferSingle.value as bigint).toString()),
    };

    return returnValue;
  } catch (error) {
    try {
      const contractInstance = new Contract(
        ABIS.OldErc1155ABI,
        nftAddress,
        provider,
      );

      txReceipt.events[0].keys = [EventTopic.TRANSFER_SINGLE];
      const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
      const returnValue: ERC1155TransferReturnValue = {
        from: formattedContractAddress(
          num.toHex(parsedEvent.TransferSingle.from as BigNumberish),
        ),
        to: formattedContractAddress(
          num.toHex(parsedEvent.TransferSingle.to as BigNumberish),
        ),
        tokenId: (parsedEvent.TransferSingle.id as bigint).toString(),
        nftAddress,
        timestamp,
        value: Number((parsedEvent.TransferSingle.value as bigint).toString()),
      };
      return returnValue;
    } catch (error) {
      throw new Error(error);
    }
  }
};

export const decodeERC115TransferBatch = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ERC1155TransferReturnValue[] => {
  const returnValues: ERC1155TransferReturnValue[] = [];
  const nftAddress = formattedContractAddress(txReceipt.events[0].from_address);
  try {
    const contractInstance = new Contract(
      ABIS.Erc1155ABI,
      nftAddress,
      provider,
    );

    const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
    const { from, to, ids, values } = parsedEvent.TransferBatch;
    const fromAddress = formattedContractAddress(
      num.toHex(from as BigNumberish),
    );
    const toAddress = formattedContractAddress(num.toHex(to as BigNumberish));
    for (let i = 0; i < (ids as BigNumberish[]).length; i++) {
      returnValues.push({
        from: fromAddress,
        to: toAddress,
        tokenId: (ids[i] as bigint).toString(),
        nftAddress,
        timestamp,
        value: Number((values[i] as bigint).toString()),
      });
    }

    return returnValues;
  } catch (error) {
    try {
      const contractInstance = new Contract(
        ABIS.OldErc1155ABI,
        nftAddress,
        provider,
      );

      txReceipt.events[0].keys = [EventTopic.TRANSFER_BATCH];
      const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
      const { from, to, ids, values } = parsedEvent.TransferBatch;
      const fromAddress = formattedContractAddress(
        num.toHex(from as BigNumberish),
      );
      const toAddress = formattedContractAddress(num.toHex(to as BigNumberish));
      for (let i = 0; i < (ids as BigNumberish[]).length; i++) {
        returnValues.push({
          from: fromAddress,
          to: toAddress,
          tokenId: (ids[i] as bigint).toString(),
          nftAddress,
          timestamp,
          value: Number((values[i] as bigint).toString()),
        });
      }

      return returnValues;
    } catch (error) {
      throw new Error(error);
    }
  }
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
  orderNonce: number | null;
  seller: string;
  buyer: string;
  currency: string;
  collection: string;
  tokenId: string;
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

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].TakerBid;
  const retrunValue: SaleReturnValue = {
    orderNonce: Number((parsedEvent.order_nonce as bigint).toString()),
    seller: formattedContractAddress(
      num.toHex(parsedEvent.maker as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex(parsedEvent.taker as BigNumberish),
    ),
    currency: formattedContractAddress(
      num.toHex(parsedEvent.currency as BigNumberish),
    ),
    collection: formattedContractAddress(
      num.toHex(parsedEvent.collection as BigNumberish),
    ),
    tokenId: (parsedEvent.token_id as bigint).toString(),
    amount: Number((parsedEvent.amount as bigint).toString()),
    price: Number((parsedEvent.price as bigint).toString()),
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

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].TakerAsk;
  const retrunValue: SaleReturnValue = {
    orderNonce: Number((parsedEvent.order_nonce as bigint).toString()),
    seller: formattedContractAddress(
      num.toHex(parsedEvent.taker as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex(parsedEvent.maker as BigNumberish),
    ),
    currency: formattedContractAddress(
      num.toHex(parsedEvent.currency as BigNumberish),
    ),
    collection: formattedContractAddress(
      num.toHex(parsedEvent.collection as BigNumberish),
    ),
    tokenId: (parsedEvent.token_id as bigint).toString(),
    amount: Number((parsedEvent.amount as bigint).toString()),
    price: Number((parsedEvent.price as bigint).toString()),
    timestamp,
  };

  return retrunValue;
};

export const decodeOrderExecuted = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): SaleReturnValue => {
  const marketplaceAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.UnframedABI,
    marketplaceAddress,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0];
  const retrunValue: SaleReturnValue = {
    orderNonce: null,
    seller: formattedContractAddress(
      num.toHex(parsedEvent.OrderExecuted.maker as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex(parsedEvent.OrderExecuted.taker as BigNumberish),
    ),
    currency: formattedContractAddress(
      num.toHex(parsedEvent.OrderExecuted.currency as BigNumberish),
    ),
    collection: formattedContractAddress(
      num.toHex(parsedEvent.OrderExecuted.collection as BigNumberish),
    ),
    tokenId: (parsedEvent.OrderExecuted.token_id as bigint).toString(),
    amount: Number((parsedEvent.OrderExecuted.amount as bigint).toString()),
    price: Number((parsedEvent.OrderExecuted.price as bigint).toString()),
    timestamp,
  };

  return retrunValue;
};

export const decodeElementSale = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): SaleReturnValue => {
  const parsedEvent = txReceipt.events[0];
  const type = Number((parsedEvent.keys[2] as bigint).toString());
  const maker = parsedEvent.keys[3];
  const taker = parsedEvent.data[0];
  const currency = parsedEvent.data[1];
  const price = parsedEvent.data[2];
  const numberFeeRecepients = Number(
    (parsedEvent.data[3] as bigint).toString(),
  );
  const collection = parsedEvent.data[4 + numberFeeRecepients * 2];
  const tokenId = uint256.uint256ToBN({
    low: parsedEvent.data[5 + numberFeeRecepients * 2],
    high: parsedEvent.data[6 + numberFeeRecepients * 2],
  });
  const amount = parsedEvent.data[7 + numberFeeRecepients * 2];

  const retrunValue: SaleReturnValue = {
    orderNonce: null,
    seller: formattedContractAddress(
      num.toHex((type == 1 ? maker : taker) as BigNumberish),
    ),
    buyer: formattedContractAddress(
      num.toHex((type == 1 ? taker : maker) as BigNumberish),
    ),
    currency: formattedContractAddress(num.toHex(currency as BigNumberish)),
    collection: formattedContractAddress(num.toHex(collection as BigNumberish)),
    tokenId: tokenId.toString(),
    amount: Number((amount as bigint).toString()),
    price: Number((price as bigint).toString()),
    timestamp,
  };

  return retrunValue;
};

export type PhaseDropUpdatedReturnValue = {
  nftAddress: string;
  phaseDropId: number;
  mintPrice: string;
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
    mintPrice:
      (phaseDrop.mint_price as bigint).toString() !== '0'
        ? web3.utils.fromWei(phaseDrop.mint_price as bigint, 'ether')
        : '0',
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
  isWarpcast: boolean;
  phaseId: number;
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
    isWarpcast: parsedEvent.FlexDropMinted.is_warpcast as any,
    phaseId: Number((parsedEvent.FlexDropMinted.phase_id as bigint).toString()),
  };

  return returnValue;
};

export type ItemStakedReturnValue = {
  collection: string;
  tokenId: string;
  owner: string;
  stakedAt: number;
};

export const decodeItemStaked = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ItemStakedReturnValue => {
  const stakingContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.StakingABI,
    stakingContract,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].ItemStaked;
  const returnValues: ItemStakedReturnValue = {
    collection: formattedContractAddress(
      num.toHex(parsedEvent.collection as BigNumberish),
    ),
    tokenId: (parsedEvent.tokenId as bigint).toString(),
    owner: formattedContractAddress(
      num.toHex(parsedEvent.owner as BigNumberish),
    ),
    stakedAt: Number((parsedEvent.stakedAt as bigint).toString()),
  };

  return returnValues;
};

export type ItemUnStakedReturnValue = {
  collection: string;
  tokenId: string;
  owner: string;
  unstakedAt: number;
  point: string;
};

export const decodeItemUnstaked = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ItemUnStakedReturnValue => {
  const stakingContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.StakingABI,
    stakingContract,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].ItemUnstaked;
  const returnValues: ItemUnStakedReturnValue = {
    collection: formattedContractAddress(
      num.toHex(parsedEvent.collection as BigNumberish),
    ),
    tokenId: (parsedEvent.tokenId as bigint).toString(),
    owner: formattedContractAddress(
      num.toHex(parsedEvent.owner as BigNumberish),
    ),
    unstakedAt: Number((parsedEvent.unstakedAt as bigint).toString()),
    point: '0',
  };

  return returnValues;
};

export type ClaimPointReturnValue = {
  user: string;
  point: string;
};

export const decodeClaimPoint = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ClaimPointReturnValue => {
  const stakingContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.StakingABI,
    stakingContract,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].ClaimPoint;
  const returnValues: ClaimPointReturnValue = {
    user: formattedContractAddress(num.toHex(parsedEvent.user as BigNumberish)),
    point: (parsedEvent.point as bigint).toString(),
  };

  console.log(returnValues);

  return returnValues;
};

export const decodeUpdateCollectible = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ContractDeployedReturnValue => {
  const contractInstance = new Contract(
    ABIS.FlexHausFactoryABI,
    txReceipt.events[0].from_address,
    provider,
  );

  const parsedEvent =
    contractInstance.parseEvents(txReceipt)[0].UpdateCollectible;
  const returnValues: ContractDeployedReturnValue = {
    address: formattedContractAddress(
      num.toHex(parsedEvent.collectible as BigNumberish),
    ),
    deployer: formattedContractAddress(
      num.toHex(parsedEvent.creator as BigNumberish),
    ),
    isFlexHausCollectible: true,
    drop_amount: Number((parsedEvent.drop_amount as bigint).toString()),
    rarity: convertDataIntoString(parsedEvent.rarity as bigint),
  };

  return returnValues;
};

export type UpdateDropReturnValue = {
  collectible: string;
  dropType: number;
  secureAmount: number;
  isRandomToSubscribers: boolean;
  fromTopSupporter: number;
  toTopSupporter: number;
  startTime: number;
  updateAt: number;
};

export const decodeUpdateDrop = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): UpdateDropReturnValue => {
  const contractInstance = new Contract(
    ABIS.FlexHausFactoryABI,
    txReceipt.events[0].from_address,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt)[0].UpdateDrop;
  const returnValues: UpdateDropReturnValue = {
    collectible: formattedContractAddress(
      num.toHex(parsedEvent.collectible as BigNumberish),
    ),
    dropType: Number((parsedEvent.drop_type as bigint).toString()),
    secureAmount: Number((parsedEvent.secure_amount as bigint).toString()),
    isRandomToSubscribers:
      Number((parsedEvent.is_random_to_subscribers as bigint).toString()) === 1,
    fromTopSupporter: Number(
      (parsedEvent.from_top_supporter as bigint).toString(),
    ),
    toTopSupporter: Number((parsedEvent.to_top_supporter as bigint).toString()),
    startTime: Number((parsedEvent.start_time as bigint).toString()) * 1e3,
    updateAt: timestamp,
  };

  return returnValues;
};

export type ClaimCollectibleReturnValue = {
  collectible: string;
  recipient: string;
};

export const decodeClaimCollectible = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): ClaimCollectibleReturnValue => {
  const flexHausFactoryAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(
    ABIS.FlexHausFactoryABI,
    flexHausFactoryAddress,
    provider,
  );

  const parsedEvent =
    contractInstance.parseEvents(txReceipt)[0].ClaimCollectible;
  const returnValues: ClaimCollectibleReturnValue = {
    collectible: formattedContractAddress(
      num.toHex(parsedEvent.collectible as BigNumberish),
    ),
    recipient: formattedContractAddress(
      num.toHex(parsedEvent.recipient as BigNumberish),
    ),
  };

  return returnValues;
};
