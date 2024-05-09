import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { iInfoToken } from './jwt.dto';

@Injectable()
export class RequestContext {
  constructor(private readonly jwtService: JwtService) {}
  public getSubJwt(request: Request): string {
    const info = this.decodeJwt(request);
    const sub = info ? info.sub : '';
    return sub;
  }

  public getTokenPayload(request: Request): iInfoToken {
    const info = this.decodeJwt(request);
    return info;
  }

  private decodeJwt(request: Request): iInfoToken {
    if (request.headers.authorization) {
      const [, token] = request.headers.authorization.split(' ');
      const info = this.jwtService.decode(token) as iInfoToken;
      return info;
    }
    return null;
  }

  getToken(request: Request): string {
    if (request.headers.authorization) {
      const [, token] = request.headers.authorization.split(' ');
      return token;
    }
    return null;
  }
}
