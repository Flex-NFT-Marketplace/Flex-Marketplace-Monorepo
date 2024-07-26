import { FLEX } from '@app/shared/constants';
import React from 'react';

const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};
const TOKEN_IMAGE = `${FLEX.FLEX_URL}/community.png`;

export const Card = ({ message, image }) => {
  const imageSrc = image ?? TOKEN_IMAGE;
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        overflow: 'hidden',
        ...CARD_DIMENSIONS,
      }}
    >
      <img
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          margin: 0,
          padding: 0,
        }}
        src={imageSrc}
        alt="Image"
      />
      {message && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '0',
            width: '100%',
            background: 'black',
            color: 'rgb(103, 191, 255)',
            fontSize: '30px',
            paddingTop: '58px',
            paddingBottom: '108px',
          }}
        >
          <p style={{ margin: '0 auto' }}>{message}</p>
        </div>
      )}
    </div>
  );
};
