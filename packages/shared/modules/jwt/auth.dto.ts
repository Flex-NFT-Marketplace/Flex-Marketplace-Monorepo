import { ApiProperty } from '@nestjs/swagger';
import { TypedData, WeierstrassSignatureType } from 'starknet';

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
  @ApiProperty({ required: true })
  address: string;
  @ApiProperty({ required: true })
  signature: WeierstrassSignatureType;
}

export class GetTokenRspDto {
  @ApiProperty()
  token: string;
}
