import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Controller, Get, Body, Post, Query } from '@nestjs/common';
import { DropPhaseService } from './dropPhases.service';
import { JWT, User } from '@app/shared/modules';
import { UpdateWarpcastDetailDto } from './dto/updateWarpcastDetail.dto';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { UpdateWhitelistMintDto } from './dto/updateWhitelist.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { DropPhaseDocument, DropPhases } from '@app/shared/models';
import { GetCollectionDropPhasesDto } from './dto/getCollectionDropPhases.dto';
import { GetCollectionDropPhaseDto } from './dto/getCollectionDropPhase.dto';
import { WhitelistProofDto } from './dto/whitelistProof.dto';

@ApiTags('OpenEdition')
@Controller('open-edition')
@ApiExtraModels(
  UpdateWarpcastDetailDto,
  UpdateWhitelistMintDto,
  DropPhases,
  WhitelistProofDto,
)
export class DropPhaseController {
  constructor(private readonly dropPhaseService: DropPhaseService) {}

  @Post('all-phases/')
  @ApiOperation({
    summary: 'Get all phase of NFT collection.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResultPagination),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        $ref: getSchemaPath(DropPhases),
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getAllPhases(
    @Body() query: GetCollectionDropPhasesDto,
  ): Promise<BaseResultPagination<DropPhaseDocument>> {
    return await this.dropPhaseService.getDropPhases(query);
  }

  @Get('phase-detail')
  @ApiOperation({
    summary: 'Get detail of specific phase',
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
                  $ref: getSchemaPath(DropPhases),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getPhaseDetail(
    @Query() query: GetCollectionDropPhaseDto,
  ): Promise<BaseResult<DropPhases>> {
    return await this.dropPhaseService.getPhaseDetail(query);
  }

  @Post('get-whitelist-proof')
  @ApiOperation({
    summary: 'Get the proof for Whitelist minting',
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
                  $ref: getSchemaPath(WhitelistProofDto),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async getWhitelistProof(
    @Body() query: GetCollectionDropPhaseDto,
  ): Promise<BaseResult<WhitelistProofDto>> {
    return null;
  }

  @JWT()
  @Post('update-warpcast-detail')
  @ApiOperation({
    summary: 'Update Warpcast detail',
  })
  async updateWarpcastDetail(
    @Body() body: UpdateWarpcastDetailDto,
    @User() user: iInfoToken,
  ) {
    return await this.dropPhaseService.editWarpcastDetail(user.sub, body);
  }

  @JWT()
  @Post('update-whitelist')
  @ApiOperation({
    summary: 'Update Whitelist to free mint of open edition',
  })
  async updateWhiteList(
    @Body() body: UpdateWhitelistMintDto,
    @User() user: iInfoToken,
  ) {
    return await this.dropPhaseService.updateWhitelist(user.sub, body);
  }
}
