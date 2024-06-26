import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UserDocument, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import {
  stark,
  ec,
  CallData,
  hash,
  Provider,
  Account,
  RawArgs,
  Contract,
} from 'starknet';
import { decryptData, encryptData } from '@app/shared/utils/encode';
import { formatBalance, formattedContractAddress } from '@app/shared/utils';
import {
  COMMON_CONTRACT_ADDRESS,
  FLEX,
  RPC_PROVIDER,
} from '@app/shared/constants';
import { v1 as uuidv1 } from 'uuid';

import ABISErc20 from './abis/erc20OZ070.sierra.json';
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}
  async createWalletByEth(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);

    const provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    if (userExist.mappingAddress) {
      if (userExist.mappingAddress.deployHash) {
        return {
          message: `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
        };
      }

      const payerAddress = userExist.mappingAddress.address;

      const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);

      const starkKeyPubAX = ec.starkCurve.getStarkKey(decodePrivateKey);
      const accountAX = new Account(provider, payerAddress, decodePrivateKey);
      const AXConstructorCallData = CallData.compile({
        owner: starkKeyPubAX,
        guardian: '0',
      });
      const dataFeeDeploy = await this.calculateFeeDeployAccount(
        accountAX,
        AXConstructorCallData,
        payerAddress,
      );

      return {
        payerAddress: payerAddress,
        creatorAddress: userExist.address,
        feeDeploy: parseFloat(formatBalance(dataFeeDeploy.feeDeploy, 18)),
      };
    }

    const privateKeyAX = stark.randomAddress();
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);

    const AXConstructorCallData = CallData.compile({
      owner: starkKeyPubAX,
      guardian: '0',
    });

    const newPrivatekey = encryptData(privateKeyAX);

    const AXcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPubAX,
      COMMON_CONTRACT_ADDRESS.ARGENTX,
      AXConstructorCallData,
      0,
    );
    const payerAddress = formattedContractAddress(AXcontractAddress);

    const accountAX = new Account(provider, payerAddress, privateKeyAX);
    const newUser: Users = {
      username: payerAddress,
      privateKey: newPrivatekey,
      address: payerAddress,
      nonce: uuidv1(),
      roles: [],
      isCreatorPayer: true,
    };

    const newPayer = await this.usersModel.create(newUser);
    newPayer.save();
    console.log('Why User', newPayer);
    await this.usersModel.findOneAndUpdate(
      {
        address: creatorAddress,
      },
      {
        $set: {
          mappingAddress: newPayer,
        },
      },
      {
        new: true,
      },
    );
    const dataFeeDeploy = await this.calculateFeeDeployAccount(
      accountAX,
      AXConstructorCallData,
      payerAddress,
    );
    return {
      payerAddress: newPayer.address,
      creatorAddress: userExist.address,
      feeDeploy: parseFloat(formatBalance(dataFeeDeploy.feeDeploy, 18)),
    };
  }

  async deployWalletByEth(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      return {
        message: `User Address argentx not deploy`,
      };
    }
    if (userExist.mappingAddress.deployHash) {
      return {
        message: `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
      };
    }
    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    const accountAX = new Account(provider, payerAddress, decodePrivateKey);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(decodePrivateKey);
    const AXConstructorCallData = CallData.compile({
      owner: starkKeyPubAX,
      guardian: '0',
    });
    //Deploy Payload
    const deployAccountPayload = {
      classHash: COMMON_CONTRACT_ADDRESS.ARGENTX,
      constructorCalldata: AXConstructorCallData,
      contractAddress: payerAddress,
      addressSalt: starkKeyPubAX,
    };
    const balanceEth = await this.getBalanceEth(accountAX, provider);
    const deployFee = await this.calculateFeeDeployAccount(
      accountAX,
      AXConstructorCallData,
      payerAddress,
    );
    if (balanceEth < deployFee.feeDeploy) {
      return {
        message: `Insufficient ETH balance to deploy argentx wallet, required ${deployFee.feeDeploy} ETH`,
      };
    }

    const { transaction_hash, contract_address } =
      await accountAX.deployAccount(deployAccountPayload);
    await provider.waitForTransaction(transaction_hash);

    const payerUpdated = await this.usersModel.findOneAndUpdate(
      {
        address: payerAddress,
      },
      {
        $set: {
          deployHash: transaction_hash,
        },
      },
      {
        new: true,
      },
    );
    await this.usersModel.findOneAndUpdate(
      {
        address: creatorAddress,
      },
      {
        $set: {
          mappingAddress: payerUpdated,
        },
      },
      {
        new: true,
      },
    );

    const approveData = await this.approveEthBalance(
      accountAX,
      balanceEth,
      deployFee.feeDeploy,
      provider,
    );
    return {
      payerAddress: contract_address,
      creatorAddress: creatorAddress,
      deployHash: transaction_hash,
      approveHash: approveData,
    };
  }

  async createWalletBySTRK(creatorAddress: string) {
    return 'Create Wallet By STRK' + creatorAddress;
  }
  async deployWalletByStrk(creatorAddress: string) {
    return 'Deploy Wallet By STRK' + creatorAddress;
  }
  async getBalancePayer(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      return {
        message: `User Address argentx not deploy`,
      };
    }
    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    const accountAX = new Account(provider, payerAddress, decodePrivateKey);

    const balanceEth = await this.getBalanceEth(accountAX, provider);
    const balanceStrk = await this.getBalanceStrk(accountAX, provider);
    return {
      payerAddress: payerAddress,
      balanceEth: formatBalance(balanceEth, 18),
      balanceStrk: formatBalance(balanceStrk, 18),
    };
  }

  // Note: This function is not used in the codebase Controller => Support Utils
  // Calculate Deploy  Account Fee
  async calculateFeeDeployAccount(
    accountAX: Account,
    axConstructorCallData: RawArgs,
    payerAddress: string,
  ) {
    const estimateAccountDeployFee = await accountAX.estimateAccountDeployFee({
      classHash: COMMON_CONTRACT_ADDRESS.ARGENTX,
      constructorCalldata: axConstructorCallData,
      contractAddress: payerAddress,
    });
    let feeDeploy = estimateAccountDeployFee.suggestedMaxFee;
    if (
      parseFloat(formatBalance(estimateAccountDeployFee.suggestedMaxFee, 18)) <
      0.000002
    ) {
      feeDeploy = feeDeploy * BigInt(10);
    }
    return {
      feeDeploy: feeDeploy,
    };
  }

  // Get balance of account
  async getBalanceEth(accountAx: Account, provider?: Provider) {
    if (!provider) {
      provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    }

    const contractEth = new Contract(
      ABISErc20.abi,
      COMMON_CONTRACT_ADDRESS.ETH,
      provider,
    );
    const initialEth = await contractEth.balanceOf(accountAx.address);
    return initialEth.toString();
  }
  async getBalanceStrk(accountAx: Account, provider?: Provider) {
    if (!provider) {
      provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    }

    const contractStrk = new Contract(
      ABISErc20.abi,
      COMMON_CONTRACT_ADDRESS.STRK,
      provider,
    );
    const initialStrk = await contractStrk.balanceOf(accountAx.address);

    // Calculate future address of the ArgentX account
    //  const balSTRK = await strkContract.call('balanceOf', [
    //    userData.payer_address,
    //  ]);
    return initialStrk.toString();
  }

  async approveEthBalance(
    accountAx: Account,
    amount: number,
    suggestMaxFee: bigint,
    provider?: Provider,
  ) {
    if (!provider) {
      provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    }

    const contractEth = new Contract(
      ABISErc20.abi,
      COMMON_CONTRACT_ADDRESS.ETH,
      provider,
    );
    // Approve ETH
    // const approveETH = contractEth.populate('approve', [
    //   FLEXDROP_TESTNET,
    //   initialEth,
    // ]);
    const approveETH = await contractEth.approve(FLEX.FLEXDROP_TESTNET, amount);
    const { transaction_hash: txApproveHash } = await accountAx.execute(
      approveETH,
      undefined,
      {
        maxFee: suggestMaxFee * BigInt(2),
      },
    );
    return txApproveHash;
  }
}
