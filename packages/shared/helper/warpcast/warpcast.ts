import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { Card } from './imageCard';
import { DropPhaseDocument } from '@app/shared/models';
import { formattedContractAddress } from '@app/shared/utils';
import { FLEX } from '@app/shared/constants';
import axios from 'axios';
import configuration from '@app/shared/configuration';

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
