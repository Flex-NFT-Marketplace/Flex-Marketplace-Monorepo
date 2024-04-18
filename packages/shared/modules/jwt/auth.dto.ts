import { ApiProperty } from '@nestjs/swagger';
import { TypedData } from 'starknet';

export class JwtPayload {
  sub: string; //address user
  role: string[];
}
export class iInfoToken extends JwtPayload {
  @ApiProperty()
  iat: number;
  @ApiProperty()
  exp: number;
}
// Request Nonce Data
export class GetNonceDto {
  @ApiProperty({ required: true })
  address: string;
}
// Response Nonce Data
export class GetNonceRspDto {
  @ApiProperty()
  nonce: number;
  @ApiProperty()
  signMessage: TypedData;
}

// Request Token DTO
export class GetTokenDto {
  @ApiProperty({
    required: true,
    example:
      '0x05a2F4c3BcbE542D6a655Fb31EcA2914F884dd8a1c23EA0B1b210746C28cfA3a',
  })
  address: string;
  @ApiProperty({
    required: true,
    example:
      '0x040459a52325f0ee1401ec9c65ae886490dee312c9f30f5d97a045af20ab3de2790096b18aa6904077e2dba445f363a828cf874ea70ca6c14a6f343a778026dca9',
  })
  publicKey: string;
  @ApiProperty({ required: true })
  signature: string;
}

export class GetTokenRspDto {
  @ApiProperty()
  token: string;
}

/// Test Request Sign
export class GetSignatureTestDto {
  @ApiProperty({
    required: true,
    example:
      '0x05a2F4c3BcbE542D6a655Fb31EcA2914F884dd8a1c23EA0B1b210746C28cfA3a',
  })
  address: string;
  @ApiProperty({
    required: true,
    example: '0x959810447aef763d4f14e951f5ddc3e7e3c237c47e30035c901e1b85758b0c',
  })
  privateKey: string;
}
