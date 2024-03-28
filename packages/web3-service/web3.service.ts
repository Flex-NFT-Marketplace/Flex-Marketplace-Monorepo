import { Injectable, Logger } from '@nestjs/common';
import {
  Provider,
  GetTransactionReceiptResponse,
  Contract,
  num,
} from 'starknet';
import { ChainDocument } from '@app/shared/models/schemas';
import { EventTopic, EventType, InterfaceId, LogsReturnValues } from './types';
import { decodeContractDeployed } from './decodeEvent';
import nftABI from './abis/nft.abi.json';
import { NftCollectionStandard } from '@app/shared/models';
import { HexToText } from '@app/shared/utils';

@Injectable()
export class Web3Service {
  logger = new Logger(Web3Service.name);

  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithType: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      for (const event of txReceipt.events) {
        if (event.keys.includes(EventTopic.CONTRACT_DEPLOYED)) {
          eventWithType.push({
            ...txReceipt,
            eventType: EventType.DEPLOY_CONTRACT,
            returnValues: decodeContractDeployed(txReceipt, chain, provider),
          });
        }
      }
    }

    return eventWithType;
  }

  async isNFTContractCreated(
    address: string,
    rpc: string,
  ): Promise<{
    standard: NftCollectionStandard;
    name?: string;
    symbol?: string;
  } | null> {
    console.log(`Smart contract deployed at address: ${address}`);

    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(nftABI, address, provider);

    let standard: NftCollectionStandard | null = null;
    try {
      if (await contractInstance.supports_interface(InterfaceId.ERC721)) {
        standard = NftCollectionStandard.ERC721;
      } else if (
        await contractInstance.supports_interface(InterfaceId.OLD_ERC721)
      ) {
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
    } catch (error) {
      try {
        if (await contractInstance.supportsInterface(InterfaceId.ERC721)) {
          standard = NftCollectionStandard.ERC721;
        } else if (
          await contractInstance.supportsInterface(InterfaceId.OLD_ERC721)
        ) {
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

    if (standard == NftCollectionStandard.ERC721) {
      const name = await contractInstance.name();
      const symbol = await contractInstance.symbol();
      return {
        name: HexToText(num.toHex(name)),
        symbol: HexToText(num.toHex(symbol)),
        standard,
      };
    } else {
      return {
        name: null,
        symbol: null,
        standard,
      };
    }
  }
}
