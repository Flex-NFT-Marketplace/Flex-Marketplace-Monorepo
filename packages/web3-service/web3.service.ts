import { Injectable, Logger } from '@nestjs/common';
import {
  Provider,
  GetTransactionReceiptResponse,
  Contract,
  num,
  BigNumberish,
  uint256,
  Account,
} from 'starknet';
import { ChainDocument } from '@app/shared/models/schemas';
import {
  ABIS,
  EventTopic,
  EventType,
  InterfaceId,
  LogsReturnValues,
} from './types';
import {
  ERC1155TransferReturnValue,
  ERC721TransferReturnValue,
  decodeCancelAllOrders,
  decodeCancelOrder,
  decodeClaimPoint,
  decodeContractDeployed,
  decodeCreatorPayoutUpdated,
  decodeERC115Transfer,
  decodeERC115TransferBatch,
  decodeERC721Transfer,
  decodeElementSale,
  decodeFlexDropMinted,
  decodeItemStaked,
  decodeItemUnstaked,
  decodeOrderExecuted,
  decodePayerUpdated,
  decodePhaseDropUpdated,
  decodeTakerAsk,
  decodeTakerBid,
  decodeUpgradedContract,
} from './decodeEvent';
import { BURN_ADDRESS, NftCollectionStandard } from '@app/shared/models';
import {
  attemptOperations,
  convertDataIntoString,
  formattedContractAddress,
} from '@app/shared/utils';

@Injectable()
export class Web3Service {
  logger = new Logger(Web3Service.name);

  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getContractInstance(
    abi: any,
    contractAddress: string,
    rpc: string,
  ): Promise<Contract> {
    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(abi, contractAddress, provider);
    return contractInstance;
  }

  getAccountInstance(address: string, privateKey: string, rpc: string) {
    const provider = this.getProvider(rpc);
    const accountInstance = new Account(provider, address, privateKey);
    return accountInstance;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }

  async getBlockNumber(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlockNumber();
    return block;
  }

  async getNftCollectionOwner(
    nftAddress: string,
    chain: ChainDocument,
  ): Promise<string> {
    let owner: string = null;
    const provider = this.getProvider(chain.rpc);
    const latestBlock = await provider.getBlock('latest');

    const eventsRes = await provider.getEvents({
      from_block: { block_number: 0 },
      to_block: { block_number: latestBlock.block_number },
      address: nftAddress,
      chunk_size: 1,
    });

    if (eventsRes.events.length > 0) {
      try {
        const deployerContract = new Contract(
          ABIS.ContractDeployerABI,
          chain.deployerContract,
          provider,
        );

        const txReceipt = await provider.getTransactionReceipt(
          eventsRes.events[0].transaction_hash,
        );
        const deployedEvent = deployerContract.parseEvents(txReceipt);
        if (deployedEvent.length == 0) {
          owner = num.toHex(
            deployedEvent[0].ContractDeployed.deployer as BigNumberish,
          );
        } else {
          const nftContract = new Contract(
            ABIS.Erc721ABI,
            nftAddress,
            provider,
          );
          const events = nftContract.parseEvents(txReceipt);
          const transferOwnershipEv = events.find(
            ev => ev.OwnershipTransferred,
          );
          owner = num.toHex(
            transferOwnershipEv.OwnershipTransferred.new_owner as BigNumberish,
          );
        }
      } catch (error) {}
    }
    return owner;
  }

  async getErc1155Balance(
    nftAddress: string,
    tokenId: string,
    userAddress: string,
    blockNumber: number,
    rpc: string,
  ): Promise<number> {
    try {
      const provider = this.getProvider(rpc);
      const contractInstance = new Contract(
        ABIS.Erc1155ABI,
        nftAddress,
        provider,
      );

      const balance = await contractInstance.call(
        'balanceOf',
        [userAddress, uint256.bnToUint256(tokenId)],
        { blockIdentifier: blockNumber },
      );
      return Number(BigInt(balance as bigint).toString());
    } catch (error) {
      return null;
    }
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithTypes: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      for (const event of txReceipt.events) {
        const txReceiptFilter = {
          ...txReceipt,
          events: txReceipt.events.filter(ev => ev == event),
        };
        if (event.keys.includes(EventTopic.CONTRACT_DEPLOYED)) {
          let returnValues = null;
          try {
            returnValues = decodeContractDeployed(txReceiptFilter, provider);
          } catch (error) {}

          if (returnValues) {
            eventWithTypes.push({
              ...txReceiptFilter,
              eventType: EventType.DEPLOY_CONTRACT,
              returnValues,
            });
          }
        } else if (event.keys.includes(EventTopic.UPGRADED)) {
          let returnValues = null;
          try {
            returnValues = decodeUpgradedContract(txReceiptFilter, provider);
          } catch (error) {}

          if (returnValues) {
            eventWithTypes.push({
              ...txReceiptFilter,
              eventType: EventType.UPGRADE_CONTRACT,
              returnValues,
            });
          }
        } else if (event.keys.includes(EventTopic.TRANSFER)) {
          let returnValues: ERC721TransferReturnValue = null;
          try {
            returnValues = decodeERC721Transfer(
              txReceiptFilter,
              provider,
              timestamp,
            );
          } catch (error) {}

          if (returnValues) {
            const eventWithType: LogsReturnValues = {
              ...txReceiptFilter,
              eventType: EventType.TRANSFER_721,
              returnValues,
            };

            if (returnValues.from === BURN_ADDRESS) {
              eventWithType.eventType = EventType.MINT_721;
            }
            if (returnValues.to === BURN_ADDRESS) {
              eventWithType.eventType = EventType.BURN_721;
            }
            eventWithTypes.push(eventWithType);
          }
        } else if (event.keys.includes(EventTopic.TRANSFER_SINGLE)) {
          let returnValues: ERC1155TransferReturnValue = null;
          try {
            returnValues = decodeERC115Transfer(
              txReceiptFilter,
              provider,
              timestamp,
            );
          } catch (error) {}

          if (returnValues) {
            const eventWithType: LogsReturnValues = {
              ...txReceiptFilter,
              eventType: EventType.TRANSFER_1155,
              returnValues,
            };

            if (returnValues.from === BURN_ADDRESS) {
              eventWithType.eventType = EventType.MINT_1155;
            }
            if (returnValues.to === BURN_ADDRESS) {
              eventWithType.eventType = EventType.BURN_1155;
            }
            eventWithTypes.push(eventWithType);
          }
        } else if (event.keys.includes(EventTopic.TRANSFER_BATCH)) {
          let returnValues: ERC1155TransferReturnValue[] = [];
          try {
            returnValues = decodeERC115TransferBatch(
              txReceiptFilter,
              provider,
              timestamp,
            );
          } catch (error) {}

          if (returnValues.length > 0) {
            for (const value of returnValues) {
              const eventWithType: LogsReturnValues = {
                ...txReceiptFilter,
                eventType: EventType.TRANSFER_1155,
                returnValues: value,
              };

              if (value.from === BURN_ADDRESS) {
                eventWithType.eventType = EventType.MINT_1155;
              }
              if (value.to === BURN_ADDRESS) {
                eventWithType.eventType = EventType.BURN_1155;
              }
              eventWithTypes.push(eventWithType);
            }
          }
        } else if (
          event.keys.includes(EventTopic.CANCEL_OFFER) &&
          chain.marketplaceContract.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CANCEL_OFFER,
            returnValues: decodeCancelOrder(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.CANCEL_ALL_ORDERS) &&
          chain.marketplaceContract.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CANCEL_ALL_ORDERS,
            returnValues: decodeCancelAllOrders(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.TAKER_BID) &&
          (chain.marketplaceContract.includes(
            formattedContractAddress(event.from_address),
          ) ||
            chain.pyramidContract ==
              formattedContractAddress(event.from_address))
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_BID,
            returnValues: decodeTakerBid(txReceiptFilter, provider, timestamp),
          });
        } else if (
          event.keys.includes(EventTopic.TAKER_ASK) &&
          (chain.marketplaceContract.includes(
            formattedContractAddress(event.from_address),
          ) ||
            chain.pyramidContract ==
              formattedContractAddress(event.from_address))
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_ASK,
            returnValues: decodeTakerAsk(txReceiptFilter, provider, timestamp),
          });
        } else if (
          event.keys.includes(EventTopic.ORDER_EXECUTED) &&
          chain.unframedContract == formattedContractAddress(event.from_address)
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_BID,
            returnValues: decodeOrderExecuted(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.ELEMENT_SALE) &&
          chain.elementContract == formattedContractAddress(event.from_address)
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_BID,
            returnValues: decodeElementSale(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.PHASE_DROP_UPDATED) &&
          chain.flexDropContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.PHASE_DROP_UPDATED,
            returnValues: decodePhaseDropUpdated(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.CREATOR_PAYOUT_UPDATED) &&
          chain.flexDropContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CREATOR_PAYOUT_UPDATED,
            returnValues: decodeCreatorPayoutUpdated(txReceiptFilter, provider),
          });
        } else if (
          event.keys.includes(EventTopic.PAYER_UPDATED) &&
          chain.flexDropContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.PAYER_UPDATED,
            returnValues: decodePayerUpdated(txReceiptFilter, provider),
          });
        } else if (
          event.keys.includes(EventTopic.FLEX_DROP_MINTED) &&
          chain.flexDropContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.FLEX_DROP_MINTED,
            returnValues: decodeFlexDropMinted(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.ITEAM_STAKED) &&
          chain.stakingContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.ITEM_STAKED,
            returnValues: decodeItemStaked(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.ITEM_UNSTAKED) &&
          chain.stakingContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.ITEM_UNSTAKED,
            returnValues: decodeItemUnstaked(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.CLAIM_POINT) &&
          chain.stakingContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CLAIM_POINT,
            returnValues: decodeClaimPoint(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        }
      }
    }

    return eventWithTypes;
  }

  async getCounterUsageSignature(
    user: string,
    nonce: number,
    chain: ChainDocument,
  ): Promise<number> {
    try {
      const provider = this.getProvider(chain.rpc);
      const contractInstance = new Contract(
        ABIS.MarketplaceABI,
        chain.currentMarketplaceContract,
        provider,
      );

      const couter = await contractInstance.get_counter_usage_signature(
        user,
        nonce,
      );

      return Number((couter as bigint).toString());
    } catch (error) {
      return null;
    }
  }

  async checkInterfaceSupported(
    address: string,
    rpc: string,
    interfaceId: string,
  ): Promise<boolean | null> {
    const provider = this.getProvider(rpc);
    const src5Instance = new Contract(ABIS.Src5ABI, address, provider);
    const supportInterfaceOperators = [
      () => src5Instance.supports_interface(interfaceId),
      () => src5Instance.supportsInterface(interfaceId),
    ];
    return await attemptOperations(supportInterfaceOperators);
  }

  async getNFTUri(
    address: string,
    tokenId: string,
    standard: NftCollectionStandard,
    rpc: string,
  ): Promise<string> {
    const provider = this.getProvider(rpc);

    let abi = ABIS.Erc721ABI;
    let otherVerAbi = ABIS.OtherErc721ABI;
    let oldVerAbi = ABIS.OldErc721ABI;
    if (standard === NftCollectionStandard.ERC1155) {
      abi = ABIS.Erc1155ABI;
      otherVerAbi = ABIS.OtherErc1155ABI;
      oldVerAbi = ABIS.OldErc1155ABI;
    }

    const contractInstance = new Contract(abi, address, provider);
    const otherVerContract = new Contract(otherVerAbi, address, provider);
    const oldVerContract = new Contract(oldVerAbi, address, provider);

    const tokenUriOperations = [
      () => contractInstance.token_uri(tokenId),
      () => contractInstance.tokenURI(tokenId),
      () => contractInstance.uri(tokenId),
      () => otherVerContract.token_uri(tokenId),
      () => otherVerContract.tokenURI(tokenId),
      () => otherVerContract.uri(tokenId),
      () => oldVerContract.token_uri(tokenId),
      () => oldVerContract.tokenURI(tokenId),
      () => oldVerContract.uri(tokenId),
    ];
    const tokenUri = await attemptOperations(tokenUriOperations);

    if (!tokenUri) return null;

    return convertDataIntoString(tokenUri);
  }

  async getERC721Owner(
    address: string,
    tokenId: string,
    rpc: string,
  ): Promise<string> {
    const provider = this.getProvider(rpc);

    const abi = ABIS.Erc721ABI;
    const otherVerAbi = ABIS.OtherErc721ABI;
    const oldVerAbi = ABIS.OldErc721ABI;

    const contractInstance = new Contract(abi, address, provider);
    const otherVerContract = new Contract(otherVerAbi, address, provider);
    const oldVerContract = new Contract(oldVerAbi, address, provider);

    const tokenOwnerOperations = [
      () => contractInstance.owner_of(tokenId),
      () => contractInstance.ownerOf(tokenId),
      () => otherVerContract.owner_of(tokenId),
      () => otherVerContract.ownerOf(tokenId),
      () => oldVerContract.owner_of(tokenId),
      () => oldVerContract.ownerOf(tokenId),
    ];
    const tokenOwner = await attemptOperations(tokenOwnerOperations);

    if (!tokenOwner) return null;

    return formattedContractAddress(num.toHex(tokenOwner as BigNumberish));
  }

  async getNFTCollectionStandard(
    address: string,
    rpc: string,
  ): Promise<NftCollectionStandard | null> {
    const isERC721 =
      (await this.checkInterfaceSupported(address, rpc, InterfaceId.ERC721)) ||
      (await this.checkInterfaceSupported(
        address,
        rpc,
        InterfaceId.OLD_ERC721,
      ));
    if (isERC721 === true) {
      return NftCollectionStandard.ERC721;
    }

    const isERC1155 =
      (await this.checkInterfaceSupported(address, rpc, InterfaceId.ERC1155)) ||
      (await this.checkInterfaceSupported(
        address,
        rpc,
        InterfaceId.OLD_ERC1155,
      ));
    if (isERC1155 === true) {
      return NftCollectionStandard.ERC1155;
    }

    return null;
  }

  async getNFTCollectionDetail(
    address: string,
    rpc: string,
  ): Promise<{
    standard: NftCollectionStandard;
    isNonFungibleFlexDropToken: boolean;
    name?: string;
    symbol?: string;
    contractUri?: string;
  } | null> {
    const provider = this.getProvider(rpc);
    const standard = await this.getNFTCollectionStandard(address, rpc);
    const isNonFungibleFlexDropToken = await this.checkInterfaceSupported(
      address,
      rpc,
      InterfaceId.NON_FUNGIBLE_FLEX_DROP_TOKEN,
    );

    if (!standard) {
      return null;
    }

    const contractInstance = new Contract(ABIS.Erc721ABI, address, provider);
    const otherVerContract = new Contract(
      ABIS.OtherErc721ABI,
      address,
      provider,
    );
    const oldVerContract = new Contract(ABIS.OldErc721ABI, address, provider);

    // List of possible operations to retrieve the contract URI
    const contractUriOperations = [
      () => contractInstance.get_contract_uri(),
      () => contractInstance.getContractURI(),
      () => otherVerContract.get_contract_uri(),
      () => otherVerContract.getContractURI(),
      () => oldVerContract.get_contract_uri(),
      () => oldVerContract.getContractURI(),
    ];

    // List of operations to retrieve the contract name
    const nameOperations = [
      () => contractInstance.name(),
      () => otherVerContract.name(),
      () => oldVerContract.name(),
    ];

    // List of operations to retrieve the contract symbol
    const symbolOperations = [
      () => contractInstance.symbol(),
      () => otherVerContract.symbol(),
      () => oldVerContract.symbol(),
    ];

    const contractUri = await attemptOperations(contractUriOperations);
    const name = await attemptOperations(nameOperations);
    const symbol = await attemptOperations(symbolOperations);

    return {
      name: name ? convertDataIntoString(name) : null,
      symbol: symbol ? convertDataIntoString(symbol) : null,
      standard,
      isNonFungibleFlexDropToken,
      contractUri: contractUri ? convertDataIntoString(contractUri) : null,
    };
  }
}
