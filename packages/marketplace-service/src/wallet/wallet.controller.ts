import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JWT, User } from '@app/shared/modules';
import { CreateWalletReqDTO, CreateWalletResDTO } from './dto/wallet.dto';
import { BaseResult } from '@app/shared/types';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { TokenType } from '@app/shared/models';

@ApiTags('Wallet')
@ApiExtraModels(CreateWalletResDTO, CreateWalletReqDTO)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @JWT()
  @Post('/create')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Create New Private Wallet From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(CreateWalletResDTO),
                },
              ],
            },
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async createWallet(
    @Body() createWalletDto: CreateWalletReqDTO,
    @User() user: iInfoToken,
  ) {
    try {
      const { feeType } = createWalletDto;
      if (feeType == TokenType.ETH) {
        const data = await this.walletService.createWalletByEth(user.sub);
        return new BaseResult({
          success: true,
          data,
        });
      }
      // } else if (feeType == TokenType.STRK) {
      // Deploy Wallet By STRK
      const data = await this.walletService.createWalletBySTRK(user.sub);
      return new BaseResult({
        success: true,
        data,
      });
    } catch (error) {
      return new BaseResult({
        success: false,
        error: error.message,
      });
    }
  }

  @JWT()
  @Post('deploy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Deploy Wallet From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async deployWallet(
    @Body() walletDto: CreateWalletReqDTO,
    @User() user: iInfoToken,
  ) {
    try {
      if (walletDto.feeType === TokenType.ETH) {
        const data = await this.walletService.deployWalletByEth(user.sub);
        return new BaseResult({
          success: true,
          data,
        });
      }
      // Deploy By STRK
      const data = await this.walletService.deployWalletByStrk(user.sub);
      return new BaseResult({
        success: true,
        data,
      });
    } catch (error) {
      return new BaseResult({
        success: false,
        error: error.message,
      });
    }
  }

  @JWT()
  @Get('get-balance-payer')
  @ApiOperation({
    summary: 'Get Balance Wallet Creator  From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async getBalanceWallet(@User() user: iInfoToken) {
    try {
      const data = await this.walletService.getBalancePayer(user.sub);
      return new BaseResult({
        success: true,
        data,
      });
    } catch (error) {
      return new BaseResult({
        success: false,
        error: error.message,
      });
    }
  }
}
