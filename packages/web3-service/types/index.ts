import { SuccessfulTransactionReceiptResponse } from 'starknet';
import contractDeployerABI from '../abis/contract-deployer.abi.json';
import erc721Abi from '../abis/erc721.abi.json';
import oldErc721Abi from '../abis/olderc721.abi.json';
import otherErc721Abi from '../abis/othererc721.abi.json';
import erc1155Abi from '../abis/erc1155.abi.json';
import oldErc1155Abi from '../abis/olderc1155.abi.json';
import otherErc1155Abi from '../abis/othererc1155.abi.json';
import marketplaceAbi from '../abis/marketplace.abi.json';
import accountAbi from '../abis/account.abi.json';
import flexDrop from '../abis/flexdrop.abi.json';
import proxyAbi from '../abis/proxy.abi.json';
import src5Abi from '../abis/src5.abi.json';
import unframedAbi from '../abis/unframed.abi.json';
import stakingAbi from '../abis/staking.abi.json';
import erc20Abi from '../abis/erc20.abi.json';
import oldErc20Abi from '../abis/olderc20.abi.json';
import openeditionAbi from '../abis/openedition.abi.json';
import flexhausfactoryAbi from '../abis/flexhausfactory.json';
import flexhausCollectibleAbi from '../abis/flexhausCollectible.abi.json';

export enum EventTopic {
  CONTRACT_DEPLOYED = '0x26b160f10156dea0639bec90696772c640b9706a47f5b8c52ea1abe5858b34d',
  UPGRADED = '0x2db340e6c609371026731f47050d3976552c89b4fbb012941663841c59d1af3',
  TRANSFER = '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9',
  TRANSFER_SINGLE = '0x182d859c0807ba9db63baf8b9d9fdbfeb885d820be6e206b9dab626d995c433', // transfer ERC-1155
  TRANSFER_BATCH = '0x2563683c757f3abe19c4b7237e2285d8993417ddffe0b54a19eb212ea574b08',
  CANCEL_ALL_ORDERS = '0x2f599d908a8c01c05b6e33acc96b798a72faf80e18281ca5ca6c94ce731ff59',
  CANCEL_OFFER = '0xb792a85dbf71e2d3655418ca28e9946996c536760c97837abc48e81d429f79',
  TAKER_BID = '0x37fb5822d8beb7f626792d8080acbee2e1b8776c0eac7628ee8fdb0bb2fcdcf',
  TAKER_ASK = '0x2a0e6bb76d0d6b53d99a2ca5173c4c8bc0e1bce64817a9a9b15ef0b254bd92a',
  ORDER_EXECUTED = '0xf10f06595d3d707241f604672ec4b6ae50eb82728ec2f3c65f6789e897760', // Unframed
  LISTING_BOUGTHT = '0x1b43f40d55364e989b3a8674460f61ba8f327542298ee6240a54ee2bf7b55bb', // Ventory
  OFFER_ACCEPTED = '0xe214ba50bf9d17a50de9ab9f433295bd671144999d5258dbc261cbf1e1c2cc', // Ventory
  ELEMENT_SALE = '0x351e5a57ea6ca22e3e3cd212680ef7f3b57404609bda942a5e75ba4724b55e0', // element
  PHASE_DROP_UPDATED = '0x2047efdab90661b07d0183dda95130911f3145be46b75991d35ec3005ee22ff',
  FLEX_DROP_MINTED = '0x2e85c3cdcfa0ab436a9b3d9fe53b1d1fde30b9696afe98c4587dc5099ea5bb9',
  CREATOR_PAYOUT_UPDATED = '0x3110384dee490385b1868cfc2b61dfe6867622bd1471235785d10eca82a0766',
  PAYER_UPDATED = '0x2c70140017209d30aaefd4a4c857d4c1fee5d63fea01c590069ca032cc1d11',
  ITEAM_STAKED = '0x274d1271c850a2be85bad3edc8ed6f31cd6065b02bd477fcf5b50bfb8b54026',
  ITEM_UNSTAKED = '0x303ee27f547520a00c69018a89934e75955cc560b82ccf2fc8b3a23dbca4036',
  CLAIM_POINT = '0xc8ca6112db318b80e9f2761ac4d56b0d3c5a589fecd1edc97734247e2fff3c',
  UPDATE_COLLECTIBLE = '0x349ac603fe6fbbc9dbbebaba27cc5129e7ac677bb3180ccfb52135cf0868603',
  UPDATE_DROP = '0x1c6c57cc5c060e6159d32f37b6721890daa0b5056b0d8aa6dc4e37a7a24efc4',
  CLAIM_COLLECTIBLE = '0x32fc35666f7ad6c2a9d2729137be42c4a09ba8f3e2150d4e13726a5e7225d27',
}

export enum InterfaceId {
  ERC721 = '0x33eb2f84c309543403fd69f0d0f363781ef06ef6faeb0131ff16ea3175bd943',
  OLD_ERC721 = '0x80ac58cd',
  ERC1155 = '0x6114a8f75559e1b39fcba08ce02961a1aa082d9256a158dd3e64964e4b1b52',
  OLD_ERC1155 = '0xd9b67a26',
  NON_FUNGIBLE_FLEX_DROP_TOKEN = '0x3e8437a5f69da6b8bd474c863221741d75466a9500cfe343ac93d0e38135c16',
}

export enum EventType {
  DEPLOY_CONTRACT = 'DEPLOY_CONTRACT',
  UPGRADE_CONTRACT = 'UPGRADE_CONTRACT',
  MINT_721 = 'MINT_721',
  BURN_721 = 'BURN_721',
  UPDATE_METADATA_721 = 'UPDATE_METADATA_721',
  MINT_1155 = 'MINT_1155',
  BURN_1155 = 'BURN_1155',
  UPDATE_METADATA_1155 = 'UPDATE_METADATA_1155',
  UNKNOWN_TRANSFER = 'UNKNOWN_TRANSFER',
  UNKNOWN_MINT = 'UNKNOWN_MINT',
  UNKNOWN_BURN = 'UNKNOWN_BURN',
  TRANSFER_20 = 'TRANSFER_20',
  MINT_20 = 'MINT_20',
  BURN_20 = 'BURN_20',
  TRANSFER_721 = 'TRANSFER_721',
  TRANSFER_1155 = 'TRANSFER_1155',
  TAKER_BID = 'TAKER_BID',
  TAKER_ASK = 'TAKER_ASK',
  CANCEL_ALL_ORDERS = 'CANCEL_ALL_ORDERS',
  CANCEL_OFFER = 'CANCEL_OFFER',
  PHASE_DROP_UPDATED = 'PHASE_DROP_UPDATED',
  FLEX_DROP_MINTED = 'FLEX_DROP_MINTED',
  CREATOR_PAYOUT_UPDATED = 'CREATOR_PAYOUT_UPDATED',
  PAYER_UPDATED = 'PAYER_UPDATED',
  ITEM_STAKED = 'ITEM_STAKED',
  ITEM_UNSTAKED = 'ITEM_UNSTAKED',
  CLAIM_POINT = 'CLAIM_POINT',
  UPDATE_DROP = 'UPDATE_DROP',
  CLAIM_COLLECTIBLE = 'CLAIM_COLLECTIBLE',
}
export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
  index?: number;
};

export const ABIS = {
  MarketplaceABI: marketplaceAbi,
  UnframedABI: unframedAbi,
  ContractDeployerABI: contractDeployerABI,
  Erc721ABI: erc721Abi,
  OldErc721ABI: oldErc721Abi,
  OtherErc721ABI: otherErc721Abi,
  Erc1155ABI: erc1155Abi,
  OldErc1155ABI: oldErc1155Abi,
  OtherErc1155ABI: otherErc1155Abi,
  FlexDropABI: flexDrop,
  AccountABI: accountAbi,
  ProxyABI: proxyAbi,
  Src5ABI: src5Abi,
  StakingABI: stakingAbi,
  Erc20ABI: erc20Abi,
  OldErc20ABI: oldErc20Abi,
  OpeneditionABI: openeditionAbi,
  FlexHausFactoryABI: flexhausfactoryAbi,
  FlexHausCollectibleABI: flexhausCollectibleAbi,
};
