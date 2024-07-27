import {
  ChainDocument,
  Chains,
  DropPhaseDocument,
  DropPhases,
  Histories,
  HistoryDocument,
  HistoryType,
  NftCollectionDocument,
  NftCollections,
  PhaseType,
  WarpcastUserDocument,
  WarpcastUsers,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetWarpcastDto } from './dto/getWarpcast.dto';
import ReactDOMServer from 'react-dom/server';
import { delay, formattedContractAddress } from '@app/shared/utils';
import puppeteer from 'puppeteer';
import {
  ImageWithText,
  checkPayerBalance,
  getFarcasterNameForFid,
  getLinkFrame,
  getMintFrame,
  getPostFrame,
  getRenderedComponentString,
  getStaticPostFrame,
  getTransactionFrame,
  hasFollowQuest,
  isCurrentTimeWithinPhase,
  mintNft,
  validateAddress,
} from '@app/shared/helper';
import { GetStartFrameDto } from './dto/getStartFrame.dto';
import { validateFrameMessage, getFrameHtml, getFrameMessage } from 'frames.js';
import { EXPLORER, FLEX } from '@app/shared/constants';

@Injectable()
export class WarpcastService {
  constructor(
    @InjectModel(DropPhases.name)
    private readonly dropPhaseModel: Model<DropPhaseDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionModel: Model<NftCollectionDocument>,
    @InjectModel(WarpcastUsers.name)
    private readonly warpcastUserModel: Model<WarpcastUserDocument>,
    @InjectModel(Histories.name)
    private readonly historyModel: Model<HistoryDocument>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
  ) {}

  browserPromise = puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  async getWarpcastDetail(query: GetWarpcastDto) {
    const { nftContract, phaseId } = query;
    const formattedAddress = formattedContractAddress(nftContract);

    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formattedAddress,
    });

    if (!nftCollection) {
      throw new HttpException('Nft contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    const creatorName = await getFarcasterNameForFid(phaseDetail.farcasterFid);

    const warpcastImage = phaseDetail.warpcastImage || nftCollection.avatar;
    const imageWithTextProps = {
      imageUrl: warpcastImage,
      nftName: nftCollection.name,
      creator: creatorName,
    };

    const appHtml = ReactDOMServer.renderToString(
      ImageWithText(imageWithTextProps),
    );

    const result = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta property="og:title" content="Flex Marketplace Openedition on Starknet" />
      <meta property="og:image" content="${warpcastImage}" />
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content="${warpcastImage}" />
      <meta name="fc:frame:button:1" content="Get Started" />
      <meta name="fc:frame:post_url" content="${FLEX.FLEX_URL}/warpcast/start-frame/${formattedAddress}/${phaseId}" />
    </head>
    <body>
      <div id="root">${appHtml}</div>
    </body>
    </html>
  `;

    return result;
  }

  async getImageMessage(query: GetWarpcastDto): Promise<Buffer> {
    const { message, nftContract, phaseId } = query;
    const formattedAddress = formattedContractAddress(nftContract);

    const headderMessage = message || 'Flex Starknet Marketplace';

    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formattedAddress,
    });

    if (!nftCollection) {
      throw new HttpException('Nft contract not found', HttpStatus.NOT_FOUND);
    }

    const phaseDetail = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!phaseDetail) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    if (!phaseDetail.warpcastImage && !nftCollection.avatar) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    const browser = await this.browserPromise; // Reuse the global browser instance
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 800, height: 800 });

    // Set the HTML content of the page to the rendered React component
    const image = phaseDetail.warpcastImage || nftCollection.avatar;
    const componentString = await getRenderedComponentString(
      image,
      headderMessage,
    ); // Function to retrieve rendered HTML content (cached if available)
    await page.setContent(componentString);

    const imageElement = await page.$('img');

    // Take a screenshot of only the image element
    const imageBuffer = await imageElement.screenshot();
    return imageBuffer;
  }

  async getStartFrame(
    nftContract: string,
    phaseId: number,
    query: GetStartFrameDto,
  ): Promise<string> {
    const { isValid, message } = await validateFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    if (!isValid || !message) {
      throw new HttpException('Invalid message', HttpStatus.BAD_REQUEST);
    }

    const formatAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatAddress,
    });
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const dropPhase = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!dropPhase) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    let frame;
    const warpcastImage = dropPhase.warpcastImage || nftCollection.avatar;
    if (!isCurrentTimeWithinPhase(dropPhase)) {
      frame = getLinkFrame(
        formatAddress,
        warpcastImage,
        `${FLEX.FLEX_DOMAIN}/open-edition/${formatAddress}`,
        'Check event details on Flex',
        'The event is not currently taking place.',
        phaseId,
      );

      const html = getFrameHtml(frame);
      return html;
    }

    const creatorName = await getFarcasterNameForFid(dropPhase.farcasterFid);
    if (message?.data.frameActionBody.castId?.fid != dropPhase.farcasterFid) {
      frame = getLinkFrame(
        formatAddress,
        warpcastImage,
        `https://warpcast.com/${creatorName}`,
        `Please go to the author @${creatorName} page to enroll in the event`,
        'NFT Openedition on Flex Marketplace',
        phaseId,
      );
    } else {
      frame = getStaticPostFrame(
        formatAddress,
        warpcastImage,
        `react-frame`,
        'Like and Recast to claim the NFT',
        phaseId,
      );
    }

    const html = getFrameHtml(frame);
    return html;
  }

  async getReactFrame(
    nftContract: string,
    phaseId: number,
    query: GetStartFrameDto,
  ): Promise<string> {
    const { isValid, message } = await validateFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });
    const formatAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel
      .findOne({
        nftContract: formatAddress,
      })
      .populate(['payers']);
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const payerDocument = nftCollection.payers[0];

    if (!payerDocument) {
      throw new HttpException('Payer not found', HttpStatus.NOT_FOUND);
    }

    const dropPhase = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!dropPhase) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    const frameMessage = await getFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    const userFid = frameMessage.requesterFid;
    const warpcastImage = dropPhase.warpcastImage || nftCollection.avatar;

    let frame;
    if (frameMessage.likedCast && frameMessage.recastedCast) {
      if (await hasFollowQuest(dropPhase)) {
        frame = getStaticPostFrame(
          formatAddress,
          warpcastImage,
          `follow-frame`,
          'Follow to claim the NFT',
          phaseId,
        );
        const html = getFrameHtml(frame);
        return html;
      }

      const claimedUser = await this.warpcastUserModel.findOne({
        fid: userFid,
        dropPhase,
      });

      const totalWarpcastMinted = await this.getTotalWarpcastMinted(
        formatAddress,
        phaseId,
      );

      const warpcastBalance =
        dropPhase.totalWarpcastMint - totalWarpcastMinted > 0 ? true : false;

      const chainDocument = await this.chainModel.findOne();
      const payerBalance = await checkPayerBalance(
        payerDocument.address,
        chainDocument.rpc,
      );

      if (payerBalance || !warpcastBalance) {
        frame = getLinkFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_DOMAIN}/open-edition/${formatAddress}`,
          'Mint on Flex',
          'Free Claim NFTs reached limits',
          phaseId,
        );

        const html = getFrameHtml(frame);
        return html;
      }
      if (!claimedUser) {
        frame = getMintFrame(
          formatAddress,
          warpcastImage,
          `mint-frame`,
          "Congrats! You're eligible for the NFT",
          phaseId,
        );
      } else {
        frame = getLinkFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_DOMAIN}/create-open-edition`,
          'Learn How To Make This At Flex',
          'You have claimed the NFT',
          phaseId,
        );
      }
    } else {
      frame = getPostFrame(
        formatAddress,
        warpcastImage,
        `react-frame`,
        'Refresh',
        'Refresh if you have liked and recasted',
        phaseId,
      );
    }
    const html = getFrameHtml(frame);
    return html;
  }

  async getFollowFrame(
    nftContract: string,
    phaseId: number,
    query: GetStartFrameDto,
  ): Promise<string> {
    const { isValid, message } = await validateFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    const formatAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel
      .findOne({
        nftContract: formatAddress,
      })
      .populate(['payers']);
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const payerDocument = nftCollection.payers[0];
    if (!payerDocument) {
      throw new HttpException('Payer not found', HttpStatus.NOT_FOUND);
    }

    const dropPhase = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!dropPhase) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    const frameMessage = await getFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    let frame;
    const warpcastImage = dropPhase.warpcastImage || nftCollection.avatar;

    if (frameMessage.requesterFollowsCaster) {
      const userFid = frameMessage.requesterFid;
      const claimedUser = await this.warpcastUserModel.findOne({
        fid: userFid,
        dropPhase,
      });

      const chainDocument = await this.chainModel.findOne();
      const payerBalance = await checkPayerBalance(
        payerDocument.address,
        chainDocument.rpc,
      );

      const totalWarpcastMinted = await this.getTotalWarpcastMinted(
        formatAddress,
        phaseId,
      );

      const warpcastBalance =
        dropPhase.totalWarpcastMint - totalWarpcastMinted > 0 ? true : false;

      if (payerBalance || !warpcastBalance) {
        frame = getLinkFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_DOMAIN}/open-edition/${formatAddress}`,
          'Mint on Flex',
          'Free Claim NFTs reached limits',
          phaseId,
        );

        const html = getFrameHtml(frame);
        return html;
      }
      if (!claimedUser) {
        frame = getMintFrame(
          formatAddress,
          warpcastImage,
          `mint/${phaseId}`,
          "Congrats! You're eligible for the NFT",
          phaseId,
        );
      } else {
        frame = getLinkFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_DOMAIN}/create-open-edition`,
          'Learn How To Make This At Flex',
          'You have claimed the NFT',
          phaseId,
        );
      }
    } else {
      frame = getPostFrame(
        formatAddress,
        warpcastImage,
        `follow/${phaseId}`,
        'Refresh',
        'Refresh if you have followed the Creator',
        phaseId,
      );
    }

    const html = getFrameHtml(frame);
    return html;
  }

  async getMintFrame(
    nftContract: string,
    phaseId: number,
    query: GetStartFrameDto,
  ): Promise<string> {
    const { isValid, message } = await validateFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    if (!isValid || !message) {
      throw new HttpException('Invalid message', HttpStatus.BAD_REQUEST);
    }

    const formatAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel
      .findOne({
        nftContract: formatAddress,
      })
      .populate(['payers']);
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const payerDocument = nftCollection.payers[0];
    if (!payerDocument) {
      throw new HttpException('Payer not found', HttpStatus.NOT_FOUND);
    }

    const dropPhase = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!dropPhase) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }

    let frame;
    const warpcastImage = dropPhase.warpcastImage || nftCollection.avatar;

    const frameMessage = await getFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });
    const receiver = frameMessage.inputText;

    if (!validateAddress(receiver)) {
      frame = getMintFrame(
        formatAddress,
        warpcastImage,
        `mint/${phaseId}`,
        'Not a valid Starknet address',
        phaseId,
      );

      const html = getFrameHtml(frame);
      return html;
    }

    const fid = frameMessage.requesterFid;
    const claimedUser = await this.warpcastUserModel.findOne({
      fid,
      dropPhase,
    });

    if (!claimedUser) {
      try {
        frame = getTransactionFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_INVENTORY}/${receiver}`,
          'Check Your NFT',
          'Transaction submitted !!',
          'See Transaction',
          `minted-transaction`,
          phaseId,
        );
        const html = getFrameHtml(frame);

        const chainDocument = await this.chainModel.findOne();
        const claimFrameResult = await mintNft(
          nftContract,
          chainDocument.rpc,
          payerDocument,
          receiver,
          phaseId,
          dropPhase.phaseType == PhaseType.PublicMint ? 1 : 2,
        );

        const warpcastUser: WarpcastUsers = {
          fid,
          dropPhase,
          txHash: claimFrameResult,
        };

        await this.warpcastUserModel.create(warpcastUser);
        return html;
      } catch (error) {}
    }
  }

  async getTxMintedFrame(
    nftContract: string,
    phaseId: number,
    query: GetStartFrameDto,
  ): Promise<string> {
    const { isValid, message } = await validateFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    if (!isValid || !message) {
      throw new HttpException('Invalid message', HttpStatus.BAD_REQUEST);
    }

    const formatAddress = formattedContractAddress(nftContract);
    const nftCollection = await this.nftCollectionModel.findOne({
      nftContract: formatAddress,
    });
    if (!nftCollection) {
      throw new HttpException('Nft Contract not found', HttpStatus.NOT_FOUND);
    }

    const dropPhase = await this.dropPhaseModel.findOne({
      nftCollection,
      phaseId,
    });
    if (!dropPhase) {
      throw new HttpException('Drop phase not found', HttpStatus.NOT_FOUND);
    }
    const frameMessage = await getFrameMessage(query, {
      hubHttpUrl: `${FLEX.HUB_URL}`,
    });

    const fid = frameMessage.requesterFid;
    const MAX_RETRIES = 3;
    let attempts = 0;
    let warpcastUser;
    let transactionHash;
    const warpcastImage = dropPhase.warpcastImage || nftCollection.avatar;

    while (attempts < MAX_RETRIES) {
      warpcastUser = await this.warpcastUserModel.findOne({
        fid,
        dropPhase,
      });

      if (warpcastUser && warpcastUser.transactionHash) {
        transactionHash = warpcastUser.transactionHash;
        break;
      }

      attempts += 1;

      if (attempts < MAX_RETRIES) {
        await delay(1); // wait 1 second before retrying
      }
    }

    if (!transactionHash) {
      throw new HttpException(
        'User not found or transactionHash is undefined after multiple retries',
        HttpStatus.NOT_FOUND,
      );
    }

    const frame: any = getLinkFrame(
      formatAddress,
      warpcastImage,
      `${EXPLORER.VOYAGER_SCAN}/tx/${transactionHash}`,
      'Transaction Link',
      'Check Your Claim Transaction',
      phaseId,
    );
    const html = getFrameHtml(frame);
    return html;
  }

  async getTotalWarpcastMinted(
    nftContract: string,
    phaseId: number,
  ): Promise<number> {
    return await this.historyModel.countDocuments({
      nftContract: formattedContractAddress(nftContract),
      phaseId,
      type: HistoryType.WarpcastMint,
    });
  }
}
