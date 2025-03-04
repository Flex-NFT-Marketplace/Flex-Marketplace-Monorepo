import { shortString, uint256 } from 'starknet';

export function getProofWhiteListMessage(
  nft_address: string,
  phase_id: number,
  minter: string,
  mint_price: string,
) {
  return {
    domain: {
      chainId: shortString.encodeShortString('SN_MAIN'), // 'SN_GOERLI' (or 'SN_MAIN')
      name: 'Flex',
      version: '1',
    },
    message: {
      phase_id,
      nft_address,
      minter,
      mint_price: uint256.bnToUint256(mint_price),
    },
    primaryType: 'WhiteListParam',
    types: {
      WhiteListParam: [
        {
          name: 'phase_id',
          type: 'u64',
        },
        {
          name: 'nft_address',
          type: 'felt',
        },
        {
          name: 'minter',
          type: 'felt',
        },
        {
          name: 'mint_price',
          type: 'u256',
        },
      ],
      u256: [
        {
          name: 'low',
          type: 'felt',
        },
        {
          name: 'high',
          type: 'felt',
        },
      ],
      StarkNetDomain: [
        {
          name: 'name',
          type: 'felt',
        },
        {
          name: 'version',
          type: 'felt',
        },
        {
          name: 'chainId',
          type: 'felt',
        },
      ],
    },
  };
}

export function getProofClaimCollectibleMessage(
  collectible: string,
  recipient: string,
) {
  const typedMessage = {
    domain: {
      name: 'FlexHaus',
      version: '1',
      chainId: shortString.encodeShortString('SN_MAIN'),
    },
    message: {
      collectible,
      recipient,
    },
    primaryType: 'ClaimableStruct',
    types: {
      ClaimableStruct: [
        {
          name: 'collectible',
          type: 'ContractAddress',
        },
        {
          name: 'recipient',
          type: 'ContractAddress',
        },
      ],
      StarkNetDomain: [
        {
          name: 'name',
          type: 'felt',
        },
        {
          name: 'version',
          type: 'felt',
        },
        {
          name: 'chainId',
          type: 'felt',
        },
      ],
    },
  };

  return typedMessage;
}
