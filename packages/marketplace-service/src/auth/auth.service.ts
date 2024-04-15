import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {}
  getSignMessage(address: string, nonce: number) {
    return `Sign this message to login!\nAddress: ${address}\nNonce: ${nonce}`;
  }
  async connectWallet() {
    return 'Connect Wallet';
  }
  async generateToken() {}
  async verifySignature() {}
}
