import { ApiProperty } from '@nestjs/swagger';

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

// Response Nonce Data
export class GetNonceRspDto {
  // @ApiProperty()
  // nonce: number;
  @ApiProperty()
  signMessage: string;
}

// Request Token DTO
export class GetTokenDto {
  @ApiProperty({ required: true })
  address: string;
  @ApiProperty({ required: true })
  signature: string;
}
