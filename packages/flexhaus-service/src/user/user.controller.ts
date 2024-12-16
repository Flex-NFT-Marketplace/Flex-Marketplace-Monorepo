import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDocument } from '@app/shared/models';
import { JWT, User } from '@app/shared/modules';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
