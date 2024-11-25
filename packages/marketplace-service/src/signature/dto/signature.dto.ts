export class SignatureDTO {
  readonly contract_address: string;

  readonly token_id: string;

  readonly signature4: string;

  readonly nonce: string;

  readonly price: number;

  readonly amount: number;

  readonly amount_sig: number;

  readonly paymentToken: string;

  readonly status: string;

  readonly transaction_hash: string;

  readonly transaction_status: string;

  readonly sell_end: number;

  readonly signer: string;

  readonly buyer_address: string;

  readonly currency: string;
}

export class UpdateSignatureDTO {
  readonly signature_id: string;

  readonly transaction_hash: string;

  readonly buyer_address: string;

  readonly amount: number;
}
