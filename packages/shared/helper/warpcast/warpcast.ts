import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { Card } from './imageCard';
import { DropPhaseDocument, UserDocument } from '@app/shared/models';
import { formatBalance, formattedContractAddress } from '@app/shared/utils';
import { COMMON_CONTRACT_ADDRESS, FLEX } from '@app/shared/constants';
import axios from 'axios';
import configuration from '@app/shared/configuration';
import {
  Account,
  CallData,
  Contract,
  RpcProvider,
  constants,
  getChecksumAddress,
  uint256,
  validateChecksumAddress,
} from 'starknet';
import { ABIS } from '@app/web3-service/types';
import { decryptData } from '@app/shared/utils/encode';

export async function getRenderedComponentString(
  image: string,
  message: string,
) {
  // If cached content is not available, render the component
  const componentString = ReactDOMServer.renderToString(
    React.createElement(Card, {
      message: message,
      image: image,
    }),
  );

  return componentString; // Return the rendered component string
}

export const isCurrentTimeWithinPhase = (dropPhase: DropPhaseDocument) => {
  const currentTime = Date.now();
  const startTime = dropPhase.startTime + 3 * 60 * 1000; // Add 3 min
  return currentTime >= startTime && currentTime <= dropPhase.endTime;
};

export function getLinkFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  message: string,
  phaseId: number,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/image-message?nftContract=${formatAddress}&phaseId=${phaseId}&message=${message}`,
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: label,
        action: 'link',
        target: `${target}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${target}`,
  };
  return frame;
}
export async function getFarcasterNameForFid(fid: number) {
  try {
    const url = `${FLEX.PINATA_HUB}/users/${fid}`;
    const apiKey = configuration().pinata_hub_key;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.status >= 200 && res.status < 300) {
      const data = res.data;
      const username = data.user.username;
      return username;
    } else {
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
export function getStaticPostFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  phaseId: number,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${image}`,
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: label,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
  };
  return frame;
}

export async function hasFollowQuest(warpcast: DropPhaseDocument) {
  try {
    if (!warpcast) {
      throw new Error('warpcast not found for the given contract address.');
    }

    const followQuestExists = warpcast.quests?.some(
      quest => quest.option === 'Follow',
    );
    return !!followQuestExists;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function checkPayerBalance(address: string, rpc: string) {
  const provider = new RpcProvider({ nodeUrl: rpc });
  const ethContract = new Contract(
    ABIS.Erc20ABI,
    COMMON_CONTRACT_ADDRESS.ETH,
    provider,
  );

  const estimateMintFeeAccount = new Account(
    provider,
    configuration().account_payer_estimate_address,
    configuration().account_payer_estimate_private_key,
  );

  const randomAddress =
    '0x05dcb49a8217eab5ed23e4a26df044edaf1428a5c7b30fa2324fa39a28288f6b';

  // TODO: 1 Openedition (Mainnet) to calculate fee
  const { suggestedMaxFee: estimatedFee1 } =
    await estimateMintFeeAccount.estimateInvokeFee({
      contractAddress: FLEX.FLEXDROP_MAINNET,
      entrypoint: 'mint_public',
      calldata: [FLEX.ESTIMATE_NFT, 1, FLEX.FLEX_RECIPT, randomAddress, 1, 1],
    });
  const feeMint = formatBalance(estimatedFee1, 18);
  // Interactions with the contract with call

  const res1 = await ethContract.balanceOf(address);
  const balance = BigInt(uint256.uint256ToBN(res1));
  const unsufficient = Number(balance) < Number(feeMint) ? true : false;

  return unsufficient;
}

export function getMintFrame(
  contractAddress: string,
  image: string,
  target: string,
  message: string,
  phaseId: number,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/image-message?nftContract=${formatAddress}&phaseId=${phaseId}&message=${message}`,
    imageAspectRatio: '1:1',
    inputText: 'Enter your Starknet address',
    buttons: [
      {
        label: `Mint`,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
  };
  return frame;
}

export function getPostFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  message: string,
  phaseId: number,
) {
  const formatAddress = formattedContractAddress(contractAddress);
  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/image-message?nftContract=${formatAddress}&phaseId=${phaseId}&message=${message}`,
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: label,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${target}/${formatAddress}/${phaseId}`,
  };
  return frame;
}

export function getTransactionFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  message: string,
  transactionLabel: string,
  transacionTarget: string,
  phaseId: number,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/image-message?nftContract=${formatAddress}&phaseId=${phaseId}&message=${message}`,
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: label,
        action: 'link',
        target: `${target}`,
      },
      {
        label: transactionLabel,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${transacionTarget}/${formatAddress}/${phaseId}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${target}`,
  };
  return frame;
}

export function validateAddress(address) {
  try {
    // Check address length
    if (address.length !== 64 && address.length !== 66) {
      return false;
    }

    const checksumAddr = getChecksumAddress(address);

    const isValid = validateChecksumAddress(checksumAddr);

    // Remove "0x" prefix if present
    address = address.startsWith('0x') ? address.slice(2) : address;

    const regex = /^[0-9a-fA-F]{64}$/;

    // Check if address matches the format
    if (!regex.test(address)) {
      return false;
    }

    return isValid;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function checkMintedAmount(
  address: string,
  openedition: string,
  rpc: string,
  phaseId: number,
  limitPerWallet: number,
) {
  const provider = new RpcProvider({ nodeUrl: rpc });

  try {
    const OpeneditionContract = new Contract(
      ABIS.OpeneditionABI,
      openedition,
      provider,
    );

    const minterMintedAmount = await OpeneditionContract.get_mint_state(
      address,
      phaseId,
    );

    console.log(minterMintedAmount);
    console.log(minterMintedAmount[0]);
    console.log(BigInt(limitPerWallet));


    if (minterMintedAmount[0] < BigInt(limitPerWallet)) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}
// checkMintedAmount(
//   '0x05dcb49a8217eab5ed23e4a26df044edaf1428a5c7b30fa2324fa39a28288f6b',
//   '0x03d1a6d306fc9b797138930a3ad2e5c9034738487e2ec7c24a7e64665d3a0da5',
//   'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
//   1,
//   1,
// );
export async function mintNft(
  nftAddress: string,
  rpc: string,
  payer: UserDocument,
  toAddress: string,
  phaseId: number,
  phaseType: number,
): Promise<string> {
  // Connect your account
  const provider = new RpcProvider({ nodeUrl: rpc });
  const decodePrivateKey = decryptData(payer.privateKey);
  const account0Address = payer.address;
  const payerAccount = new Account(provider, account0Address, decodePrivateKey);
  const flexDropContract = new Contract(
    ABIS.FlexDropABI,
    FLEX.FLEXDROP_MAINNET,
    provider,
  );

  flexDropContract.connect(payerAccount);
  console.log('Invoke Tx - Minting 1 NFT to...' + toAddress);
  if (phaseType == 1) {
    try {
      const result = await payerAccount.execute({
        contractAddress: FLEX.FLEXDROP_MAINNET,
        entrypoint: 'mint_public',
        calldata: CallData.compile({
          nft_address: nftAddress,
          phase_id: phaseId,
          fee_recipient: FLEX.FLEX_RECIPT,
          minter_if_not_payer: toAddress,
          quantity: 1,
          is_warpcast: true,
        }),
      });

      return result.transaction_hash;
    } catch (error) {
      console.log('Minting Failed ' + error);
      return error;
    }
  } else if (phaseId == 2) {
    // TODO: Mint other type
  }
}
