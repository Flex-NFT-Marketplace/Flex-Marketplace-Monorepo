import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { Card } from './imageCard';

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
