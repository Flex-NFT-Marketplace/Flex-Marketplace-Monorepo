import {
  DropPhaseDocument,
  DropPhases,
  NftCollectionDocument,
  NftCollections,
} from '@app/shared/models';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetImageMessage } from './dto/getImageMessage.dto';
import { BaseResult } from '@app/shared/types';
import { formattedContractAddress } from '@app/shared/utils';
import puppeteer from 'puppeteer';
import { getRenderedComponentString } from '@app/shared/helper';

@Injectable()
export class WarpcastService {
  constructor(
    @InjectModel(DropPhases.name)
    private readonly dropPhaseModel: Model<DropPhaseDocument>,
    @InjectModel(NftCollections.name)
    private readonly nftCollectionService: Model<NftCollectionDocument>,
  ) {}

  browserPromise = puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  async getImageMessage(query: GetImageMessage): Promise<BaseResult<Buffer>> {
    const { message, nftContract, phaseId } = query;
    const formattedAddress = formattedContractAddress(nftContract);

    const headderMessage = message || 'Flex Starknet Marketplace';

    const nftCollection = await this.nftCollectionService.findOne({
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
    return new BaseResult(imageBuffer);
  }
}
