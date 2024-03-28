import { ChainDocument } from '@app/shared/models';
import {
  BigNumberish,
  Contract,
  GetTransactionReceiptResponse,
  Provider,
  num,
} from 'starknet';
import deployerContractAbi from './abis/contract-deployer.abi.json';
import { formattedContractAddress } from '@app/shared/utils';

export type ContractDeployedReturnValue = {
  address: string;
  deployer: string;
};

export const decodeContractDeployed = (
  txReceipt: GetTransactionReceiptResponse,
  chain: ChainDocument,
  provider: Provider,
): ContractDeployedReturnValue[] => {
  const returnValue: ContractDeployedReturnValue[] = [];
  const contractInstance = new Contract(
    deployerContractAbi,
    chain.deployerContract,
    provider,
  );

  const parsedEvent = contractInstance.parseEvents(txReceipt);
  for (const event of parsedEvent) {
    returnValue.push({
      address: formattedContractAddress(
        num.toHex(event.ContractDeployed.address as BigNumberish),
      ),
      deployer: formattedContractAddress(
        num.toHex(event.ContractDeployed.deployer as BigNumberish),
      ),
    });
  }

  return returnValue;
};
