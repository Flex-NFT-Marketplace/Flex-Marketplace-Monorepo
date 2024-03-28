import { SuccessfulTransactionReceiptResponse } from 'starknet';

export enum EventTopic {
  CONTRACT_DEPLOYED = '0x26b160f10156dea0639bec90696772c640b9706a47f5b8c52ea1abe5858b34d',
  TRANSFER = '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9',
  TRANSFER_SINGLE = '0x182d859c0807ba9db63baf8b9d9fdbfeb885d820be6e206b9dab626d995c433', // transfer ERC-1155
  TRANSFER_BATCH = '0x2563683c757f3abe19c4b7237e2285d8993417ddffe0b54a19eb212ea574b08',
  CANCEL_ALL_ORDERS = '0x2f599d908a8c01c05b6e33acc96b798a72faf80e18281ca5ca6c94ce731ff59',
  CANCEL_OFFER = '0xb792a85dbf71e2d3655418ca28e9946996c536760c97837abc48e81d429f79',
  TAKER_BID = '0x37fb5822d8beb7f626792d8080acbee2e1b8776c0eac7628ee8fdb0bb2fcdcf',
  TAKER_ASK = '0x2a0e6bb76d0d6b53d99a2ca5173c4c8bc0e1bce64817a9a9b15ef0b254bd92a',
}

export enum InterfaceId {
  ERC721 = '0x33eb2f84c309543403fd69f0d0f363781ef06ef6faeb0131ff16ea3175bd943',
  OLD_ERC721 = '0x80ac58cd',
  ERC1155 = '0x6114a8f75559e1b39fcba08ce02961a1aa082d9256a158dd3e64964e4b1b52',
  OLD_ERC1155 = '0xd9b67a26',
}

export enum EventType {
  DEPLOY_CONTRACT = 'DEPLOY_CONTRACT',
  MINT = 'MINT',
  BURN = 'BURN',
  TRANSFER = 'TRANSFER',
  TAKER_BID = 'TAKER_BID',
  TAKER_ASK = 'TAKER_ASK',
  CANCEL_ALL_ORDERS = 'CANCEL_ALL_ORDERS',
  CANCEL_OFFER = 'CANCEL_OFFER',
}
export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
};
