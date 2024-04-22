import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import configuration from '@app/shared/configuration';

import {
  GetSignatureTestDto,
  GetTokenDto,
  JwtPayload,
} from '@app/shared/modules/jwt/auth.dto';
import {
  WeierstrassSignatureType,
  shortString,
  TypedData,
  Provider,
  Account,
  typedData,
  stark,
  num,
} from 'starknet';
import { Web3Service } from '@app/web3-service/web3.service';
import { HexToText, formattedContractAddress } from '@app/shared/utils';
import { ABIS } from '@app/web3-service/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    this.web3Service = new Web3Service();
  }
  private readonly web3Service: Web3Service;
  async getSignMessage(address: string, nonce: number) {
    const typedDataValidate: TypedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Validate: [
          { name: 'id', type: 'felt' },
          { name: 'from', type: 'felt' },
          { name: 'nonce', type: 'felt' },
        ],
      },
      primaryType: 'Validate',
      domain: {
        name: 'flex-marketplace',
        version: '1',
        chainId: shortString.encodeShortString('SN_SEPOLIA'),
      },
      message: {
        id: '0x0000004f000f',
        from: address,
        nonce: nonce,
      },
    };
    return typedDataValidate;
  }
  async verifySignature(address: string, signature: string[], rpc: string) {
    const user = await this.userService.getUser(address);
    const message = await this.getSignMessage(address, user.nonce);
    try {
      const msgHash = typedData.getMessageHash(message, address);

      const accountContract = this.web3Service.getContractInstance(
        ABIS.AccountABI,
        address,
        rpc,
      );

      const result = await accountContract.is_valid_signature(
        msgHash,
        signature,
      );

      // const result1 = ec.starkCurve.verify(signature, msgHash, publicKey);

      console.log('Why Result', result);
      console.log('Result ', HexToText(num.toHex(result)));
      // return result1;
      return HexToText(num.toHex(result));
    } catch (error) {
      return false;
    }
  }
  async login({ address, signature, rpc }: GetTokenDto) {
    const accessPayload = {
      sub: address,
      role: [],
    };
    const data = await this.verifySignature(address, signature, rpc);
    if (!data) {
      throw new Error('Signature is not valid');
    }
    const token = await this.generateToken(accessPayload);
    return {
      token: token,
    };
  }

  async generateToken(accessPayload: JwtPayload) {
    const token = await this.jwtService.signAsync(accessPayload, {
      secret: configuration().jwt_secret,
    });
    return token;
  }

  // Test Function
  async testSignMessage({
    address,
    privateKey,
    nonce,
  }: GetSignatureTestDto & { nonce: number }) {
    address = formattedContractAddress(address);

    const rpc = 'https://starknet-sepolia.public.blastapi.io';
    const provider = new Provider({ nodeUrl: rpc });

    const account = new Account(provider, address, privateKey);

    //Get SignMessage
    const message = await this.getSignMessage(address, nonce);

    const signature = (await account.signMessage(
      message,
    )) as WeierstrassSignatureType;

    const formatSignature = stark.formatSignature(signature);

    return {
      address: address,
      signature: formatSignature,
    };
  }
}
