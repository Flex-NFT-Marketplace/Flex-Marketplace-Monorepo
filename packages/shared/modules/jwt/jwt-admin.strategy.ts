import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '@app/shared/models';
import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { JwtPayload } from './jwt.dto';
import { ROLE } from '@app/shared/constants';
import { formattedContractAddress } from '@app/shared/utils';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
    // private readonly jwtService: RequestContext,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration().jwt_secret,
    });
  }
  async validate(payload: JwtPayload) {
    const { sub } = payload;

    const user = await this.userModel
      .findOne({ address: formattedContractAddress(sub) })
      .exec();

    if (!user || !user.roles || !user.roles.includes(ROLE.ADMIN)) {
      throw new UnauthorizedException('Only Admin Have Right To Access This');
    }
    return payload;
  }
}
