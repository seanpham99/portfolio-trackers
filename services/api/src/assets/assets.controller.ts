import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { PopularAssetDto } from '@workspace/shared-types/api';

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

  /**
   * GET /assets/:symbol - Fetch asset by exact symbol match
   */
  @Get(':symbol')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get asset details by symbol' })
  @ApiParam({
    name: 'symbol',
    description: 'Asset symbol (e.g., BTC, AAPL, VNM)',
  })
  @ApiResponse({ status: 200, description: 'Asset found' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getBySymbol(@Param('symbol') symbol: string) {
    const asset = await this.assetsService.findBySymbol(symbol);
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${symbol}`);
    }
    return asset;
  }
}
