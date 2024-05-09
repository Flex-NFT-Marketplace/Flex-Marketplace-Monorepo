import { Body, Controller, Get, Post, Query, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  GetNonceReqDto,
  GetNonceRspDto,
  GetSignatureTestDto,
  GetTokenReqDto,
  GetTokenRspDto,
} from './dto/authQuery.dto';
import { BaseResult } from '@app/shared/types/base.result';
import { UserService } from '../user/user.service';
import { formattedContractAddress } from '@app/shared/utils/formatContractAddress';
@ApiTags('Authentication')
@ApiExtraModels(GetNonceRspDto, BaseResult, GetTokenRspDto)
@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/get-nonce')
  @ApiOperation({
    summary: 'Get SignMessage API',
    description: 'Use this API to get the sign message for the user.',
  })
  @HttpCode(200)
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
    @Query() query: GetNonceReqDto,
  ): Promise<BaseResult<GetNonceRspDto>> {
    const user = await this.userService.getOrCreateUser(query.address);

    const message = await this.authService.getSignMessage(
      query.address,
      user.nonce,
    );
    return {
      success: true,
      data: {
        nonce: user.nonce,
        signMessage: message,
      },
    };
  }

  @Post('/token')
  @ApiOperation({
    summary: 'Login To Get Access Token API',
    description:
      'After User Sign the message, use this API to get the access token.',
  })
  @HttpCode(200)
  @ApiOkResponse({
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
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            errors: {
              example: 'Error Message',
            },
            data: {},
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async connectWallet(
    @Body() tokenDto: GetTokenReqDto,
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
        error: error.message,
      };
    }
  }

  @Post('/test-sign')
  @ApiOperation({
    summary: 'It just for testing purpose.',
    description: 'Testing Service ',
  })
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
