import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsHexadecimal, IsNumber, IsUrl } from 'class-validator';
import { TypedData } from 'starknet';

export class JwtPayload {
  sub: string; //address user
  role: string[];
}
export class iInfoToken extends JwtPayload {
  @ApiProperty()
  @IsNumber()
  iat: number;

  @ApiProperty()
  @IsNumber()
  exp: number;
}
// Request Nonce Data
export class GetNonceDto {
  @ApiProperty({ required: true })
  address: string;
}
// Response Nonce Data
// Response Nonce Data
export class GetNonceRspDto {
  @ApiProperty()
  @IsNumber()
  nonce: number;

  @ApiProperty({
    description: 'The sign message from server',
  })
  signMessage: TypedData;
}

// Request Token DTO
export class GetTokenDto {
  @ApiProperty({
    required: true,
  })
  @IsHexadecimal()
  address: string;
  @ApiProperty({ required: true })
  @IsArray()
  signature: string[];
  @ApiProperty({
    required: true,
    example: 'https://starknet-sepolia.public.blastapi.io',
  })
  @IsUrl()
  rpc: string;
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
