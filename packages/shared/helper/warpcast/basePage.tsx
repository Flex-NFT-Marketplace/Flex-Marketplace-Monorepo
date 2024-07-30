import React from 'react';
import { FLEX } from '@app/shared/constants';

export function ImageWithText({ imageUrl, nftName, creator, nftAddress }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0D0E13',
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <style>{`
        .container {
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: auto;
          border: 1px solid #3A3A3C;
          background: #000000;
          max-width: 90%;
        }
        .bg_img {
          position: absolute;
          top: 50%;
          object-fit: cover;
          width: 100%;
          pointer-events: none;
        }
        .image-container {
          width: 300px;
          height: 300px;
        }
        .text-container {
          flex: 1 1 0%;
          display: flex;
          flex-basis: 300px;
          justify-content: center;
          flex-direction: column;
          padding: 20px;
        }
        .image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .button {
          background-color: #64D2FF;
          color: #000;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          width: 100%;
          max-width: 200px;
        }

        .button:hover {
          background-color: white;
        }
        @media only screen and (max-width: 640px) {
          .container {
            flex-wrap: wrap;
          }

          .image-container {
            width: 100%;
          }
        }
      `}</style>
      <img className="bg_img" src="/bg_line.png" />
      <div className="container">
        <div className="image-container">
          <img src={imageUrl} alt="Image" className="image" />
        </div>
        <div className="text-container">
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: 'white', fontSize: '44px' }}>
              {nftName}
            </strong>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'white', fontSize: '24px' }}>{creator}</span>
          </div>
          <a
            href={`${FLEX.FLEX_OPENEDITION}/${nftAddress}`}
            style={{ textDecoration: 'none' }}
          >
            <button className="button">Mint on Flex</button>
          </a>
        </div>
      </div>
    </div>
  );
}
