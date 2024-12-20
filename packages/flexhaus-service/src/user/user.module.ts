import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import {
  FlexHausSubscription,
  UserSchema,
  Users,
  flexHausSubscriptionSchema,
} from '@app/shared/models';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UserSchema },
      { name: FlexHausSubscription.name, schema: flexHausSubscriptionSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
