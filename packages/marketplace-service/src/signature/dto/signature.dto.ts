import { IsHexadecimal, IsNumber, IsString } from 'class-validator';

export class SignatureDTO {
  @IsHexadecimal()
  readonly nftContract: string;

  @IsString()
  readonly tokenId: string;

  @IsString()
  readonly signature4: string;

  @IsString()
  readonly nonce: string;

  @IsNumber()
  readonly price: number;

  @IsNumber()
  readonly amount: number;

  @IsNumber()
  readonly amountSig: number;

  // @IsHexadecimal()
  // readonly paymentToken: string;

  @IsString()
  readonly status: string;

  readonly transactionHash: string;

  @IsString()
  readonly transactionStatus: string;

  @IsNumber()
  readonly sellEnd: number;

  // readonly signer: string;

  readonly buyerAddress: string;

  @IsHexadecimal()
  readonly currency: string;
}

export class UpdateSignatureDTO {
  readonly signatureId: string;

  readonly transactionHash: string;

  readonly buyerAddress: string;

  readonly amount: number;
}
