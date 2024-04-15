import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import configuration from '../../configuration';
import { JwtPayload } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import { RequestContext } from './requestcontext';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: RequestContext,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration().jwt_secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { sub } = payload;
    const user = await this.userModel.findById(sub).exec();
    if (!user) {
    }
    return payload;
  }
}
