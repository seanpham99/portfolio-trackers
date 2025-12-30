import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { PopularAssetDto } from '@workspace/api-types';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * GET /assets/search - Search for assets by symbol or name
   * Throttled to prevent abuse
   */
  @Get('search')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @ApiOperation({ summary: 'Search assets by symbol or name' })
  async search(@Query('q') query: string) {
    return this.assetsService.search(query);
  }

  /**
   * GET /assets/popular - Get popular/trending assets
   */
  @Get('popular')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get popular assets for quick access' })
  @ApiResponse({ status: 200, type: [PopularAssetDto] })
  async getPopular(): Promise<PopularAssetDto[]> {
    return this.assetsService.getPopular();
  }
}
