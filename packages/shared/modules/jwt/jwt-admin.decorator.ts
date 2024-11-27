import {
  ExecutionContext,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';

import { ApiBearerAuth } from '@nestjs/swagger';
import { iInfoToken } from './jwt.dto';
import { JwtAdminAuthGuard } from './jwt-admin.auth.guard';

export function JWTAdmin() {
  return applyDecorators(UseGuards(JwtAdminAuthGuard), ApiBearerAuth('JWT'));
}

export const Admin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as iInfoToken;
  },
);
