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
  return currentTime >= dropPhase.startTime && currentTime <= dropPhase.endTime;
};

export function getLinkFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  message: string,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/image/message?message=${message}`,
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
    const apiKey = configuration().pinata_key;

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
        target: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
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
    process.env.ESTIMATE_ACCOUNT_ADDRESS,
    process.env.ESTIMATE_ACCOUNT_PRI,
    undefined,
    constants.TRANSACTION_VERSION.V3,
  );

  const randomAddress =
    '0x05dcb49a8217eab5ed23e4a26df044edaf1428a5c7b30fa2324fa39a28288f6b';

  // TODO: 1 Openedition (Mainnet) to calculate fee
  const { suggestedMaxFee: estimatedFee1 } =
    await estimateMintFeeAccount.estimateInvokeFee({
      contractAddress: FLEX.FLEXDROP_MAINNET,
      entrypoint: 'mint_public',
      calldata: [FLEX.ESTIMATE_NFT, 1, FLEX.FLEX_RECIPT, randomAddress, 1],
    });
  let feeMint = formatBalance(estimatedFee1, 18);
  // Interactions with the contract with call
  const res1 = await ethContract.balanceOf(address);
  const balance = BigInt(uint256.uint256ToBN(res1.balance));
  const unsufficient = Number(balance) < Number(feeMint) ? true : false;

  return unsufficient;
}

export function getMintFrame(
  contractAddress: string,
  image: string,
  target: string,
  message: string,
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/image/message?message=${message}`,
    imageAspectRatio: '1:1',
    inputText: 'Enter your Starknet address',
    buttons: [
      {
        label: `Mint`,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
  };
  return frame;
}

export function getPostFrame(
  contractAddress: string,
  image: string,
  target: string,
  label: string,
  message: string,
) {
  const formatAddress = formattedContractAddress(contractAddress);
  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/image/message?message=${message}`,
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: label,
        action: 'post',
        target: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
      },
    ],
    ogImage: `${image}`,
    postUrl: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${target}`,
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
) {
  const formatAddress = formattedContractAddress(contractAddress);

  const frame = {
    version: 'vNext',
    image: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/image/message?message=${message}`,
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
        target: `${FLEX.FLEX_URL}/warpcast/${formatAddress}/${transacionTarget}`,
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

      await provider.waitForTransaction(result.transaction_hash);
      return result.transaction_hash;
    } catch (error) {
      console.log('Minting Failed ' + error);
      return error;
    }
  } else if (phaseId == 2) {
    // TODO: Mint other type
  }
}
