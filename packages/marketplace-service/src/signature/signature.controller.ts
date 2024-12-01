import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SignatureDTO, UpdateSignatureDTO } from './dto/signature.dto';
import { SignatureService } from './signature.service';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResult } from '@app/shared/types';

import { GetSignatureActivityQueryDTO } from './dto/getSignatureQuery';
import { JWT, User } from '@app/shared/modules';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';

@ApiTags('Signatures')
@Controller('signatures')
@ApiExtraModels(GetSignatureActivityQueryDTO)
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  //   @JWT()
  @JWT()
  @Post()
  async createSignature(
    @Body() signatureDTO: SignatureDTO,
    @User() token: iInfoToken,
  ) {
    const res = await this.signatureService.createSignature(
      signatureDTO,
      token.sub,
    );

    if (!res) {
      return new BadRequestException();
    }
    return new BaseResult(res);
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

  @Get('bid/:contract_address/:token_id')
  async getSignatureBid(
    @Param('contract_address') contractAddress: string,
    @Param('token_id') tokenId: string,
  ) {
    const res = await this.signatureService.getBidSignatures(
      contractAddress,
      tokenId,
    );
    return new BaseResult(res);
    // return new ResponseData(res, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }

  @Get(':contract_address/:token_id')
  async getSignature(
    @Param('contract_address') contractAddress: string,
    @Param('token_id') tokenId: string,
  ) {
    const res = await this.signatureService.getSignature(
      contractAddress,
      tokenId,
    );
    return new BaseResult(res);
  }

  @JWT()
  @Put('/bid')
  async updateSignatureBid(
    @Body() updateSignDTO: UpdateSignatureDTO,
    @User() token: iInfoToken,
  ) {
    const res = await this.signatureService.updateSignatureBid(
      updateSignDTO,
      token.sub,
    );
    return new BaseResult(res);
  }

  @JWT()
  @Put()
  async updateSignature(@Body() updateSignDTO: UpdateSignatureDTO) {
    const res = await this.signatureService.updateSignature(updateSignDTO);
    return new BaseResult(res);
  }

  @JWT()
  @Put('cancel_order/:signature_id')
  async cancelSignature(
    @Param('signature_id') signatureId: string,
    @User() token: iInfoToken,
  ) {
    await this.signatureService.cancelSignature(signatureId, token.sub);
    return new BaseResult(true);
  }

  // @Get('UpdateSignature')
  // async updateSignatureStatus() {
  //   await this.signatureService.updateAllSignature();
  //   return new BaseResult(true);
  // }
}
