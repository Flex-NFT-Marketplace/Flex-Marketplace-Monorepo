import { ApiProperty } from '@nestjs/swagger';

export class WhitelistProofDto {
  @ApiProperty()
  userAddress: string;

  @ApiProperty()
  nftContract: string;

  @ApiProperty()
  phaseId: number;

  @ApiProperty()
  proof: string[];

  @ApiProperty()
  isUsed: boolean;
}
