import { IsEnum } from 'class-validator';
import { TokenType } from '@app/shared/models';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletReqDTO {
  @ApiProperty({
    required: true,
    enum: TokenType,
  })
  @IsEnum(TokenType)
  feeType: TokenType;
}

export class CreateWalletResDTO extends CreateWalletReqDTO {
  @ApiProperty()
  payerAddress: string;
  @ApiProperty()
  suggestMaxFee: string;
  @ApiProperty()
  suggestMinFee: string;
  @ApiProperty()
  creatorAddress: string;
}

export class WidthDrawDTO {
  reciverAddress: string;
  amount: number;
  tokenType: TokenType;
}
