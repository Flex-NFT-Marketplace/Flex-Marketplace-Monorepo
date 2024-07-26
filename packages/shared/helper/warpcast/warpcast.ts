import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { Card } from './imageCard';
import { DropPhaseDocument } from '@app/shared/models';
import { formattedContractAddress } from '@app/shared/utils';
import { FLEX } from '@app/shared/constants';

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
