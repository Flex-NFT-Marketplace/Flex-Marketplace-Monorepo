import {
  ExecutionContext,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt.auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { iInfoToken } from './jwt.dto';

export function JWT() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth('JWT'));
}

/// This is a custom decorator to get the user from the request object
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as iInfoToken;
  },
);
