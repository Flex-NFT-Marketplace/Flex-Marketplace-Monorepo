import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import configuration from '@app/shared/configuration';
import { GetTokenDto, JwtPayload } from '@app/shared/modules/jwt/auth.dto';
import {
  WeierstrassSignatureType,
  shortString,
  TypedData,
  Provider,
  Account,
  stark,
  typedData,
  ec,
  num,
  encode,
} from 'starknet';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
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
  async verifySignature(address: string, signature: WeierstrassSignatureType) {
    const user = await this.userService.getUser(address);
    const message = await this.getSignMessage(address, user.nonce);
    console.log('Current ', signature);
    // const newSignature = stark.formatSignature(signature);
    // fake private key
    try {
      const msgHash = typedData.getMessageHash(message, address);

      const result1 = ec.starkCurve.verify(signature, msgHash, address);
      console.log('Result (boolean) =', result1);
    } catch (error) {
      console.log('verification failed:', error);
      return false;
    }
    return true;
  }
  async login({ address, signature }: GetTokenDto) {
    const accessPayload = {
      sub: address,
      role: [],
    };
    const data = await this.verifySignature(address, signature);
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
  async verifyToken(token: string) {
    return await this.jwtService.verifyAsync(token, {
      secret: configuration().jwt_secret,
    });
  }

  // Test Function
  async testSignMessage() {
    const rpc = 'https://starknet-sepolia.public.blastapi.io';
    const provider = new Provider({ nodeUrl: rpc });
    const userAddress =
      '0x05a2F4c3BcbE542D6a655Fb31EcA2914F884dd8a1c23EA0B1b210746C28cfA3a';
    const privateKey =
      '0x959810447aef763d4f14e951f5ddc3e7e3c237c47e30035c901e1b85758b0c';
    const account = new Account(provider, userAddress, privateKey);

    // const message = await this.getSignMessage(userAddress, 123456);
    const message: TypedData = {
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
        from: userAddress,
        nonce: 123456,
      },
    };

    const signature = (await account.signMessage(
      message,
    )) as WeierstrassSignatureType;
    const formattedSignature = stark.formatSignature(signature);

    try {
      const msgHash = typedData.getMessageHash(message, userAddress);
      // const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
      // const contractAccount = new Contract(
      //   ABIS.AccountABI,
      //   userAddress,
      //   provider,
      // );
      const fullPublicKey = encode.addHexPrefix(
        encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false)),
      );
      const result1 = ec.starkCurve.verify(
        signature,
        msgHash,
        num.toHex(fullPublicKey as any),
      );

      console.log('Result (boolean) =', result1);
    } catch (error) {
      console.log('verification failed:', error);
      return false;
    }
    return formattedSignature;
  }
}
