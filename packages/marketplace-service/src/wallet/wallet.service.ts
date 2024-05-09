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
} from 'starknet';
import { decryptData, encryptData } from '@app/shared/utils/encode';
import { formatBalance, formattedContractAddress } from '@app/shared/utils';
import { COMMON_CONTRACT_ADDRESS, RPC_PROVIDER } from '@app/shared/constants';
import { v1 as uuidv1 } from 'uuid';
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
        suggestMaxFee: dataFeeDeploy.suggestMaxFee,
        feeDeploy: dataFeeDeploy.feeDeploy.toString(),
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
      suggestMaxFee: dataFeeDeploy.suggestMaxFee,
      feeDeploy: dataFeeDeploy.feeDeploy,
    };
  }

  async createWalletBySTRK(creatorAddress: string) {
    return 'Create Wallet By STRK' + creatorAddress;
  }

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
    let feeDeploy = parseFloat(
      formatBalance(estimateAccountDeployFee.suggestedMaxFee, 18),
    );
    if (feeDeploy < 0.0002) {
      console.log(feeDeploy);
      feeDeploy = feeDeploy * 1000;
    }
    return {
      feeDeploy: feeDeploy.toString(),
      suggestMaxFee: formatBalance(
        estimateAccountDeployFee.suggestedMaxFee,
        18,
      ),
    };
  }
}
