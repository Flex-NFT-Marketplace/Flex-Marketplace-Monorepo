import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UserDocument, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { stark, ec, CallData, hash, Provider, Account } from 'starknet';
import { encryptData } from '@app/shared/utils/encode';
import { formatBalance, formattedContractAddress } from '@app/shared/utils';
import { COMMON_CONTRACT_ADDRESS, RPC_PROVIDER } from '@app/shared/constants';
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}
  async createWalletByEth(creatorAddress: string) {
    const userExist = await this.userService.getUser(creatorAddress);
    if (userExist.mappingAddress) {
      return {
        message: `User Address argentx already deploy at: ${userExist.deployHash}`,
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

    const provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });

    const accountAX = new Account(provider, payerAddress, privateKeyAX);
    const newUser: Users = {
      username: payerAddress,
      privateKey: newPrivatekey,
      address: payerAddress,
      nonce: '',
      roles: [],
    };

    const newPayer = await this.usersModel.create(newUser);
    const estimateAccountDeployFee = await accountAX.estimateAccountDeployFee({
      classHash: COMMON_CONTRACT_ADDRESS.ARGENTX,
      constructorCalldata: AXConstructorCallData,
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
      payerAddress: newPayer.address,
      creatorAddress: userExist.address,
      suggestMaxFee: feeDeploy,
    };
  }
}
