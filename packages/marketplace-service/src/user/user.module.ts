import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import { UserSchema, Users } from '@app/shared/models';

import { JwtModule } from '@nestjs/jwt';
import configuration from '@app/shared/configuration';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: configuration().jwt_secret,
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
