import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';

export function JWT() {
  UseGuards(JwtAuthGuard);
}
