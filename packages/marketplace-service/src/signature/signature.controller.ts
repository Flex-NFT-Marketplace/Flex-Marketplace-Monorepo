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
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { GetSignatureActivityQueryDTO } from './dto/getSignatureQuery';

@ApiTags('Signatures')
@Controller('signatures')
@ApiExtraModels(GetSignatureActivityQueryDTO)
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  //   @JWT()
  @Post()
  async createSignature(@Body() signatureDTO: SignatureDTO) {
    const res = await this.signatureService.createSignature(signatureDTO);

    if (!res) {
      return new BadRequestException();
    }
    return new BaseResult(res);
  }

  @Get('/activity')
  async getNFTActivity(@Query() query: GetSignatureActivityQueryDTO) {
    const {
      contract_address,
      page,
      size,
      sortPrice,
      minPrice,
      maxPrice,
      status,
      search,
    } = query;
    const res = await this.signatureService.getNFTActivity(
      contract_address,
      page,
      size,
      sortPrice,
      minPrice,
      maxPrice,
      status,
      search,
    );

    const result = new BaseResultPagination<any>();
    result.data = new PaginationDto<any>(res.data, res.totalPages, page, size);
    return result;
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

  @Put('/bid')
  async updateSignatureBid(@Body() updateSignDTO: UpdateSignatureDTO) {
    const res = await this.signatureService.updateSignatureBid(updateSignDTO);
    return new BaseResult(res);
  }

  @Put()
  async updateSignature(@Body() updateSignDTO: UpdateSignatureDTO) {
    const res = await this.signatureService.updateSignature(updateSignDTO);
    return new BaseResult(res);
  }

  @Put('cancel_order/:signature_id')
  async cancelSignature(@Param('signature_id') signatureId: string) {
    await this.signatureService.cancelSignature(signatureId);
    return new BaseResult(true);
  }

  // @Get('UpdateSignature')
  // async updateSignatureStatus() {
  //   await this.signatureService.updateAllSignature();
  //   return new BaseResult(true);
  // }
}
