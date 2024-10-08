import { InjectModel } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';
import { TokenType, UserDocument, Users } from '@app/shared/models';
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
  constants,
  cairo,
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
import configuration from '@app/shared/configuration';
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}
  async getOrCreateWalletByEth(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);

    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    // Estimate Mint Fee Account
    // TODO: 1 Openedition (Mainnet) to calculate fee
    const randomAddress =
      '0x05dcb49a8217eab5ed23e4a26df044edaf1428a5c7b30fa2324fa39a28288f6b';
    /// Test Constant Account estimate Fee
    const estimateMintFeeAccount = new Account(
      provider,
      configuration().account_payer_estimate_address,
      configuration().account_payer_estimate_private_key,
    );
    const { suggestedMaxFee: estimatedFee1 } =
      await estimateMintFeeAccount.estimateInvokeFee({
        contractAddress: FLEX.FLEXDROP_MAINNET,
        entrypoint: 'mint_public',
        calldata: [FLEX.ESTIMATE_NFT, 1, FLEX.FLEX_RECIPT, randomAddress, 1, 1],
      });

    if (userExist.mappingAddress) {
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
        feeType: TokenType.ETH,
        feeDeploy: formatBalance(dataFeeDeploy.feeDeploy, 18),
        privateKey: decodePrivateKey,
        estimateMinFee: formatBalance(estimatedFee1, 18),
        deployHash: userExist.mappingAddress.deployHash,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      privateKey: privateKeyAX,
      feeType: TokenType.ETH,
      feeDeploy: formatBalance(dataFeeDeploy.feeDeploy, 18),
      estimateMinFee: formatBalance(estimatedFee1, 18),
    };
  }

  async deployWalletByEth(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      throw new BadRequestException(`User Address argentx not created`);
    }
    if (userExist.mappingAddress.deployHash) {
      throw new BadRequestException(
        `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
      );
    }
    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
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
      throw new BadRequestException(
        `Insufficient ETH balance to deploy argentx wallet, required ${formatBalance(deployFee.feeDeploy, 18)} ETH to ${payerAddress}`,
      );
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
    const userExist = await this.userService.getUser(creatorAddress);

    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    if (userExist.mappingAddress) {
      if (userExist.mappingAddress.deployHash) {
        throw new BadRequestException(
          `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
        );
      }

      const payerAddress = userExist.mappingAddress.address;

      const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);

      const starkKeyPubAX = ec.starkCurve.getStarkKey(decodePrivateKey);
      const accountAX = new Account(
        provider,
        payerAddress,
        decodePrivateKey,
        undefined,
        constants.TRANSACTION_VERSION.V3,
      );
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
        feeType: TokenType.STRK,
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

    const accountAX = new Account(
      provider,
      payerAddress,
      privateKeyAX,
      undefined,
      constants.TRANSACTION_VERSION.V3,
    );
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
      feeType: TokenType.STRK,
      feeDeploy: parseFloat(formatBalance(dataFeeDeploy.feeDeploy, 18)),
    };
  }
  async deployWalletByStrk(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      throw new BadRequestException(`User Address argentx not created`);
    }
    if (userExist.mappingAddress.deployHash) {
      throw new BadRequestException(
        `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
      );
    }
    const payerAddress = formattedContractAddress(
      userExist.mappingAddress.address,
    );
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    const accountAX = new Account(
      provider,
      payerAddress,
      decodePrivateKey,
      undefined,
      constants.TRANSACTION_VERSION.V3,
    );
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
    const balanceSTRK = await this.getBalanceStrk(accountAX, provider);
    const deployFee = await this.calculateFeeDeployAccount(
      accountAX,
      AXConstructorCallData,
      payerAddress,
    );
    if (balanceSTRK < deployFee.feeDeploy) {
      throw new BadRequestException(
        `Insufficient STRK balance to deploy argentx wallet, required ${deployFee.feeDeploy} STRK`,
      );
    }

    const { transaction_hash, contract_address } =
      await accountAX.deployAccount(deployAccountPayload, {
        maxFee: deployFee.feeDeploy * BigInt(8),
      });
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

    // const approveData = await this.approveEthBalance(
    //   accountAX,
    //   balanceSTRK,
    //   deployFee.feeDeploy,
    //   provider,
    // );
    return {
      payerAddress: contract_address,
      creatorAddress: creatorAddress,
      deployHash: transaction_hash,
      // approveHash: approveData,
    };
  }
  async getBalancePayer(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      throw new BadRequestException(`User Address argentx not deploy`);
    }
    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    const accountAX = new Account(provider, payerAddress, decodePrivateKey);

    const balanceEth = await this.getBalanceEth(accountAX, provider);
    const balanceStrk = await this.getBalanceStrk(accountAX, provider);

    return {
      payerAddress: payerAddress,
      balanceEth: formatBalance(balanceEth, 18),
      balanceStrk: formatBalance(balanceStrk, 18),
    };
  }
  async withDrawEth(
    creatorAddress: string,
    reciverAddress: string,
    amount: number,
  ) {
    const userExist = await this.userService.getUser(creatorAddress);

    if (!userExist.mappingAddress || !userExist.mappingAddress.deployHash) {
      // throw new BadRequestException(`User Address argentx not created`);
      throw new BadRequestException('User Address argentx invalid ', {
        cause: new Error(),
        description: `User Address argentx not created or deployHash not found`,
      });
    }

    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    const accountAX = new Account(provider, payerAddress, decodePrivateKey);
    const balanceEth = await this.getBalanceEth(accountAX, provider);
    if (Number(formatBalance(balanceEth, 18)) < amount) {
      throw new BadRequestException(
        `Insufficient ETH balance to withdraw, Your Balance: ${formatBalance(balanceEth, 18)} ETH`,
      );
    }
    try {
      const { transaction_hash } = await accountAX.execute({
        contractAddress: COMMON_CONTRACT_ADDRESS.ETH,
        entrypoint: 'transfer',
        calldata: CallData.compile({
          recipient: reciverAddress,
          amount: cairo.uint256(amount * 1e18),
        }),
      });
      await provider.waitForTransaction(transaction_hash);
      return {
        payerAddress: payerAddress,
        creatorAddress: creatorAddress,
        transactionHash: transaction_hash,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async withDrawStrk(
    creatorAddress: string,
    reciverAddress: string,
    amount: number,
  ) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (!userExist.mappingAddress) {
      throw new BadRequestException(`User Address argentx not created`);
    }
    if (userExist.mappingAddress.deployHash) {
      throw new BadRequestException(
        `User Address argentx already deploy at: ${userExist.mappingAddress.deployHash}`,
      );
    }
    const payerAddress = userExist.mappingAddress.address;
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    const accountAX = new Account(
      provider,
      payerAddress,
      decodePrivateKey,
      undefined,
      constants.TRANSACTION_VERSION.V3,
    );
    const { transaction_hash } = await accountAX.execute(
      {
        contractAddress: COMMON_CONTRACT_ADDRESS.ETH,
        entrypoint: 'transfer',
        calldata: CallData.compile({
          recipient: reciverAddress,
          amount: cairo.uint256(amount),
        }),
      },
      undefined,
      {
        version: 3,
        maxFee: 10 ** 15,
      },
    );
    await provider.waitForTransaction(transaction_hash);
    return {
      payerAddress: payerAddress,
      creatorAddress: creatorAddress,
      transactionHash: transaction_hash,
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
      provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
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
      provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
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
      provider = new Provider({ nodeUrl: RPC_PROVIDER.MAINNET });
    }

    const contractEth = new Contract(
      ABISErc20.abi,
      COMMON_CONTRACT_ADDRESS.ETH,
      provider,
    );
    // Approve ETH
    const approveETH = contractEth.populate('approve', [
      FLEX.FLEXDROP_MAINNET,
      amount,
    ]);
    // const approveETH = await contractEth.approve(FLEX.FLEXDROP_MAINNET, amount);
    const { transaction_hash: txApproveHash } = await accountAx.execute(
      approveETH,
      undefined,
    );
    return txApproveHash;
  }
}
