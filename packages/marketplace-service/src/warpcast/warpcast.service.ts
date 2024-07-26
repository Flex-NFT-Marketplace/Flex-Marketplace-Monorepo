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
  WarpcastUserDocument,
  WarpcastUsers,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetImageMessage } from './dto/getImageMessage.dto';
import { BaseResult } from '@app/shared/types';
import { formattedContractAddress } from '@app/shared/utils';
import puppeteer from 'puppeteer';
import {
  checkPayerBalance,
  getFarcasterNameForFid,
  getLinkFrame,
  getMintFrame,
  getPostFrame,
  getRenderedComponentString,
  getStaticPostFrame,
  hasFollowQuest,
  isCurrentTimeWithinPhase,
} from '@app/shared/helper';
import { GetStartFrameDto } from './dto/getStartFrame.dto';
import { validateFrameMessage, getFrameHtml, getFrameMessage } from 'frames.js';
import { FLEX } from '@app/shared/constants';

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

  async getImageMessage(query: GetImageMessage): Promise<Buffer> {
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

  async getStartFrame(query: GetStartFrameDto): Promise<string> {
    const { nftContract, phaseId } = query;
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
      );
    } else {
      frame = getStaticPostFrame(
        formatAddress,
        warpcastImage,
        `react/${phaseId}`,
        'Like and Recast to claim the NFT',
      );
    }

    const html = getFrameHtml(frame);
    return html;
  }

  async getReactFrame(query: GetStartFrameDto): Promise<string> {
    const { nftContract, phaseId } = query;

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
          `follow/${phaseId}`,
          'Follow to claim the NFT',
        );
        const html = getFrameHtml(frame);
        return html;
      }

      const warpcastUser = await this.warpcastUserModel.findOne({
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
        );

        const html = getFrameHtml(frame);
        return html;
      }
      if (!warpcastUser) {
        frame = getMintFrame(
          formatAddress,
          warpcastImage,
          `mint/${phaseId}`,
          "Congrats! You're eligible for the NFT",
        );
      } else {
        frame = getLinkFrame(
          formatAddress,
          warpcastImage,
          `${FLEX.FLEX_DOMAIN}/create-open-edition`,
          'Learn How To Make This At Flex',
          'You have claimed the NFT',
        );
      }
    } else {
      frame = getPostFrame(
        formatAddress,
        warpcastImage,
        `react/${phaseId}`,
        'Refresh',
        'Refresh if you have liked and recasted',
      );
    }
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
