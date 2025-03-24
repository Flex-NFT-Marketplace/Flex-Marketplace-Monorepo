import { formattedContractAddress } from './../../../shared/utils/formatContractAddress';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { SignatureDTO, UpdateSignatureDTO } from './dto/signature.dto';
import { SignatureService } from './signature.service';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResult } from '@app/shared/types';

import { GetSignatureActivityQueryDTO } from './dto/getSignatureQuery';
import { JWT, User } from '@app/shared/modules';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { AddToCartDTO, AddToCartItemDTO } from './dto/addToCart.dto';

@ApiTags('Signatures')
@Controller('signatures')
@ApiExtraModels(GetSignatureActivityQueryDTO, SignatureDTO, AddToCartDTO)
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  //   @JWT()
  @JWT()
  @Post('create-signature')
  async createSignature(
    @Body() signatureDTO: SignatureDTO,
    @User() token: iInfoToken,
  ) {
    try {
      const res = await this.signatureService.createSignature(
        signatureDTO,
        token.sub,
      );

      if (!res) {
        return new BadRequestException();
      }
      return new BaseResult(res);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/activity')
  @ApiOperation({
    summary: 'Get NFT activity signature',
    description: 'Get nft activity signature data',
  })
  async getNFTActivity(@Query() query: GetSignatureActivityQueryDTO) {
    try {
      const res = await this.signatureService.getNFTActivity(query);
      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('actvityNftCollections')
  @ApiOperation({
    summary: 'Get NFT Collection activity signature',
    description: 'Get nft CollectionActivity activity signature data',
  })
  async getNFTCollectionActivity(@Query() query: GetSignatureActivityQueryDTO) {
    try {
      const res = await this.signatureService.getNftCollectionActivity(query);
      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('bid/:nftContract/:tokenId')
  async getSignatureBid(
    @Param('nftContract') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ) {
    const res = await this.signatureService.getBidSignatures(
      contractAddress,
      tokenId,
    );
    return new BaseResult(res);
    // return new ResponseData(res, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }

  @Get(':nftContract/:tokenId')
  async getSignature(
    @Param('nftContract') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ) {
    const res = await this.signatureService.getSignature(
      contractAddress,
      tokenId,
    );
    return new BaseResult(res);
  }

  @JWT()
  @Post('add-to-cart')
  async addSignatureToCart(
    @Body() addToCard: AddToCartDTO,
    @User() token: iInfoToken,
  ) {
    const res = await this.signatureService.addToCart(addToCard, token.sub);
    return new BaseResult(res);
  }

  @JWT()
  @Get('cart')
  async getCarts(@User() token: iInfoToken) {
    const res = await this.signatureService.getCart(token.sub);

    return new BaseResult(res);
  }

  @JWT()
  @Delete('cart/delete-item')
  async deleteItemFromCart(
    @Body() item: AddToCartItemDTO,
    @User() token: iInfoToken,
  ) {
    const res = await this.signatureService.deleteItemOnCart(item, token.sub);
    return new BaseResult(res);
  }

  @JWT()
  @Delete('cart/delete-all-items')
  async deleteAllItemsFromCart(@User() token: iInfoToken) {
    const res = await this.signatureService.deleteAllItems(token.sub);
    return new BaseResult(res);
  }

  @JWT()
  @Put('/bid')
  async updateSignatureBid(
    @Body() updateSignDTO: UpdateSignatureDTO,
    @User() token: iInfoToken,
  ) {
    try {
      const res = await this.signatureService.updateSignatureBid(
        updateSignDTO,
        formattedContractAddress(token.sub),
      );
      return new BaseResult(res);
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }

  @JWT()
  @Put()
  async updateSignature(@Body() updateSignDTO: UpdateSignatureDTO) {
    try {
      const res = await this.signatureService.updateSignature(updateSignDTO);
      return new BaseResult(res);
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }

  @JWT()
  @Put('cancel-order/:signatureId')
  async cancelSignature(
    @Param('signatureId') signatureId: string,
    @User() token: iInfoToken,
  ) {
    try {
      await this.signatureService.cancelSignature(
        signatureId,
        formattedContractAddress(token.sub),
      );
      return new BaseResult(true);
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }

  // @Get('UpdateSignature')
  // async updateSignatureStatus() {
  //   await this.signatureService.updateAllSignature();
  //   return new BaseResult(true);
  // }
}
