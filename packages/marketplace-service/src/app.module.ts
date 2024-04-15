import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import configuration from '@app/shared/configuration';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forRoot(configuration().db_path),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
