import { Injectable, Logger } from '@nestjs/common';
import {
  Provider,
  GetTransactionReceiptResponse,
  Contract,
  num,
  BigNumberish,
  uint256,
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
  decodeContractDeployed,
  decodeCreatorPayoutUpdated,
  decodeERC115Transfer,
  decodeERC115TransferBatch,
  decodeERC721Transfer,
  decodeFlexDropMinted,
  decodePayerUpdated,
  decodePhaseDropUpdated,
  decodeTakerAsk,
  decodeTakerBid,
  decodeUpgradedContract,
} from './decodeEvent';
import { BURN_ADDRESS, NftCollectionStandard } from '@app/shared/models';
import {
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
    classHash: string,
    contractAddress: string,
    rpc: string,
  ): Promise<Contract> {
    const provider = this.getProvider(rpc);
    const { abi } = await provider.getClassByHash(classHash);
    const contractInstance = new Contract(abi, contractAddress, provider);
    return contractInstance;
  }

  // async getImplementClassABI(
  //   contractAddress: string,
  //   rpc: string,
  // ): Promise<any> {
  //   const provider = this.getProvider(rpc);
  //   const { abi } = await provider.getClassAt(contractAddress);

  //   // try to get implementation class if given contract is proxy contract
  //   const getImplemetationFunc = abi.find(
  //     fn => fn.name === 'getImplementation',
  //   );

  //   if(getImplemetationFunc) {
  //     const implClassHash = await abi.
  //   }
  // }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
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
    tokenId: number,
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
          formattedContractAddress(event.from_address) ==
            chain.marketplaceContract
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
          formattedContractAddress(event.from_address) ==
            chain.marketplaceContract
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
          formattedContractAddress(event.from_address) ==
            chain.marketplaceContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_BID,
            returnValues: decodeTakerBid(txReceiptFilter, provider, timestamp),
          });
        } else if (
          event.keys.includes(EventTopic.TAKER_ASK) &&
          formattedContractAddress(event.from_address) ==
            chain.marketplaceContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TAKER_ASK,
            returnValues: decodeTakerAsk(txReceiptFilter, provider, timestamp),
          });
        } else if (
          event.keys.includes(EventTopic.PHASE_DROP_UPDATED) &&
          formattedContractAddress(event.from_address) == chain.flexDropContract
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
          formattedContractAddress(event.from_address) == chain.flexDropContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CREATOR_PAYOUT_UPDATED,
            returnValues: decodeCreatorPayoutUpdated(txReceiptFilter, provider),
          });
        } else if (
          event.keys.includes(EventTopic.PAYER_UPDATED) &&
          formattedContractAddress(event.from_address) == chain.flexDropContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.PAYER_UPDATED,
            returnValues: decodePayerUpdated(txReceiptFilter, provider),
          });
        } else if (
          event.keys.includes(EventTopic.FLEX_DROP_MINTED) &&
          formattedContractAddress(event.from_address) == chain.flexDropContract
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
    const provider = this.getProvider(chain.rpc);
    const contractInstance = new Contract(
      ABIS.MarketplaceABI,
      chain.marketplaceContract,
      provider,
    );

    const couter = await contractInstance.get_counter_usage_signature(
      user,
      nonce,
    );

    return Number((couter as bigint).toString());
  }

  async getNFTCollectionDetail(
    address: string,
    rpc: string,
    classHash?: string,
  ): Promise<{
    standard: NftCollectionStandard;
    isNonFungibleFlexDropToken: boolean;
    classHash: string;
    name?: string;
    symbol?: string;
    baseUri?: string;
    contractUri?: string;
  } | null> {
    console.log(`Smart contract deployed at address: ${address}`);

    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(ABIS.Erc721ABI, address, provider);

    let standard: NftCollectionStandard | null = null;
    let isNonFungibleFlexDropToken = false;
    try {
      if (await contractInstance.supports_interface(InterfaceId.ERC721)) {
        standard = NftCollectionStandard.ERC721;
      } else if (
        await contractInstance.supports_interface(InterfaceId.ERC1155)
      ) {
        standard = NftCollectionStandard.ERC1155;
      } else if (
        await contractInstance.supports_interface(InterfaceId.OLD_ERC1155)
      ) {
        standard = NftCollectionStandard.ERC1155;
      }

      if (
        await contractInstance.supports_interface(
          InterfaceId.NON_FUNGIBLE_FLEX_DROP_TOKEN,
        )
      ) {
        isNonFungibleFlexDropToken = true;
      }
    } catch (error) {
      try {
        if (await contractInstance.supportsInterface(InterfaceId.ERC721)) {
          standard = NftCollectionStandard.ERC721;
        } else if (
          await contractInstance.supportsInterface(InterfaceId.ERC1155)
        ) {
          standard = NftCollectionStandard.ERC1155;
        } else if (
          await contractInstance.supportsInterface(InterfaceId.OLD_ERC1155)
        ) {
          standard = NftCollectionStandard.ERC1155;
        }

        if (
          await contractInstance.supportsInterface(
            InterfaceId.NON_FUNGIBLE_FLEX_DROP_TOKEN,
          )
        ) {
          isNonFungibleFlexDropToken = true;
        }
      } catch (error) {
        // This means the contract does not implement the function or reverted the call
        this.logger.log(
          `Contract does not implement supportsInterface or execution failed ${address}`,
        );
        return null;
      }
    }

    if (!standard) {
      return null;
    }

    let baseUri: string = null;
    let contractUri: string = null;
    if (isNonFungibleFlexDropToken) {
      baseUri = await contractInstance.get_base_uri();
      contractUri = await contractInstance.get_contract_uri();
    }

    let implClashHash = classHash;
    if (!classHash) {
      implClashHash = await provider.getClassHashAt(address);
    }

    if (standard == NftCollectionStandard.ERC721) {
      const name = await contractInstance.name();
      const symbol = await contractInstance.symbol();
      return {
        name: convertDataIntoString(name),
        symbol: convertDataIntoString(symbol),
        isNonFungibleFlexDropToken,
        standard,
        baseUri: baseUri ? convertDataIntoString(baseUri) : null,
        contractUri: contractUri ? convertDataIntoString(contractUri) : null,
        classHash: formattedContractAddress(implClashHash),
      };
    } else {
      return {
        name: null,
        symbol: null,
        standard,
        isNonFungibleFlexDropToken,
        baseUri: baseUri ? convertDataIntoString(baseUri) : null,
        contractUri: contractUri ? convertDataIntoString(contractUri) : null,
        classHash: implClashHash,
      };
    }
  }
}
