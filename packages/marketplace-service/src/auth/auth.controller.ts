import { formattedContractAddress } from './../../../shared/utils/formatContractAddress';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  GetNonceDto,
  GetNonceRspDto,
  GetSignatureTestDto,
  GetTokenDto,
  GetTokenRspDto,
} from '@app/shared/modules/jwt/auth.dto';
import { BaseResult } from '@app/shared/types/base.result';
import { UserService } from '../user/user.service';
@ApiTags('Authentication')
@ApiExtraModels(GetNonceRspDto, BaseResult, GetTokenRspDto)
@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/getNonce')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(GetNonceRspDto) },
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
          properties: {
            error: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async getNonce(
    @Query() query: GetNonceDto,
  ): Promise<BaseResult<GetNonceRspDto>> {
    const address = formattedContractAddress(query.address);
    const user = await this.userService.getOrCreateUser(address);
    console.log('Now User', user);
    const message = await this.authService.getSignMessage(address, user.nonce);
    return {
      success: true,
      data: {
        nonce: user.nonce,
        signMessage: message,
      },
    };
  }

  @Post('/token')
  @ApiOkResponse({
    description: 'API Get Token ',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(GetTokenRspDto) },
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
          properties: {
            error: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async connectWallet(
    @Body() tokenDto: GetTokenDto,
  ): Promise<BaseResult<GetTokenRspDto>> {
    try {
      const data = await this.authService.login(tokenDto);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        data: error.message,
      };
    }
  }

  @Post('/test-sign')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                },
                signature: { type: 'string' },
              },
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
          properties: {
            error: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async testSign(
    @Body() testSignDto: GetSignatureTestDto,
  ): Promise<BaseResult<any>> {
    try {
      const address = formattedContractAddress(testSignDto.address);
      const user = await this.userService.getUser(address);
      if (!user) {
        throw new Error('User not found');
      }
      const data = await this.authService.testSignMessage({
        address: address,
        privateKey: testSignDto.privateKey,
        nonce: user.nonce,
      });
      return new BaseResult({ success: true, data: data });
    } catch (error) {
      return new BaseResult({
        success: false,
        data: {
          error: error.message,
        },
      });
    }
  }
}
