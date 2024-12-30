export class SignatureDTO {
  readonly nftContract: string;

  readonly tokenId: string;

  readonly signature4: string;

  readonly nonce: string;

  readonly price: number;

  readonly amount: number;

  readonly amountSig: number;

  readonly paymentToken: string;

  readonly status: string;

  readonly transactionHash: string;

  readonly transactionStatus: string;

  readonly sellEnd: number;

  // readonly signer: string;

  readonly buyerAddress: string;

  readonly currency: string;
}

export class UpdateSignatureDTO {
  readonly signatureId: string;

  readonly transactionHash: string;

  readonly buyerAddress: string;

  readonly amount: number;
}
