import { FrameActionPayload } from 'frames.js';
import { ApiProperty } from '@nestjs/swagger';

export type ActionIndex = (1 | 2 | 3 | 4) & number;

export class GetStartFrameDto implements FrameActionPayload {
  @ApiProperty()
  trustedData: { messageBytes: string };
  @ApiProperty()
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: ActionIndex;
    castId: { fid: number; hash: string };
    inputText?: string;
    state?: string;
    address?: string;
    transactionId?: string;
  };
  @ApiProperty()
  clientProtocol?: string;
}
