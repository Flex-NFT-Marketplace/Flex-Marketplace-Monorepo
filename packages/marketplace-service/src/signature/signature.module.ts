import { Logger, Module } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';

import { MongooseModule } from '@nestjs/mongoose';
import {
  NftCollections,
  NftCollectionSchema,
  Nfts,
  NftSchema,
  Signature,
  SignatureSchema,
} from '@app/shared/models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Signature.name, schema: SignatureSchema },
      { name: Nfts.name, schema: NftSchema },
      { name: NftCollections.name, schema: NftCollectionSchema },
    ]),
  ],
  controllers: [SignatureController],
  providers: [SignatureService, Logger],
  exports: [SignatureService],
})
export class SignatureModule {}
