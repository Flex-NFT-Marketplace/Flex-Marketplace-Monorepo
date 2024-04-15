import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export function JWT() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth('JWT'));
}
