import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SIGN_MESSAGE } from '@app/shared/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async getSignMessage(address: string) {
    const result = await this.userService.getOrCreateUser(address);
    const data = SIGN_MESSAGE({ address: result.address, nonce: result.nonce });
    return data;
  }

  async login({ address }: { address: string }) {
    const accessPayload = {
      sub: address,
      role: [],
    };
    const token = await this.jwtService.signAsync(accessPayload);
    return token;
  }
  async generateToken() {}
  async verifySignature() {}
}
