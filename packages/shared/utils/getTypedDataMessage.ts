import { shortString } from 'starknet';

export function getProofWhiteListMessage(
  nft_address: string,
  phase_id: number,
  minter: string,
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
