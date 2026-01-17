import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Request,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { DiscoveryService } from './discovery.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { PopularAssetDto } from '@workspace/shared-types/api';
import {
  DiscoveredAssetDto,
  SubmitAssetRequestDto,
  AssetRequestResponseDto,
} from './dto/discovery.dto';
import { DiscoverableAssetClass } from '@workspace/shared-types';

interface AuthenticatedRequest {
  user: {
    id: string;
    email?: string;
  };
}

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly discoveryService: DiscoveryService,
  ) {}

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
   * GET /assets/discover - Search external providers for assets
   * Searches Yahoo Finance for stocks, CoinGecko for crypto
   */
  @Get('discover')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Discover assets from external providers',
    description:
      'Search Yahoo Finance for stocks or CoinGecko for crypto when asset is not in our registry',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (symbol or name)',
    required: true,
  })
  @ApiQuery({
    name: 'assetClass',
    description: 'Asset class to search',
    enum: DiscoverableAssetClass,
    required: true,
  })
  @ApiResponse({
    status: 200,
    type: [DiscoveredAssetDto],
    description: 'List of discovered assets',
  })
  async discover(
    @Query('q') query: string,
    @Query('assetClass') assetClass: DiscoverableAssetClass,
  ): Promise<DiscoveredAssetDto[]> {
    if (!query || query.length < 1) {
      throw new BadRequestException('Query must be at least 1 character');
    }

    if (!Object.values(DiscoverableAssetClass).includes(assetClass)) {
      throw new BadRequestException(
        `Invalid assetClass. Must be one of: ${Object.values(DiscoverableAssetClass).join(', ')}`,
      );
    }

    return this.discoveryService.searchExternal(query, assetClass);
  }

  /**
   * POST /assets/request - Submit an asset tracking request
   */
  @Post('request')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Request tracking for a new asset',
    description:
      'Submit an asset to the pending queue for admin review and automated backfilling',
  })
  @ApiResponse({
    status: 201,
    type: AssetRequestResponseDto,
    description: 'Asset request submitted successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate request - you have already requested this asset',
  })
  async submitRequest(
    @Body() dto: SubmitAssetRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AssetRequestResponseDto> {
    const userId = req.user.id;

    // Check for existing request
    const hasExisting = await this.discoveryService.hasExistingRequest(
      dto.symbol,
      dto.assetClass,
      userId,
    );

    if (hasExisting) {
      throw new ConflictException(
        `You have already requested tracking for ${dto.symbol}. Please wait for admin review.`,
      );
    }

    try {
      const pendingAsset = await this.discoveryService.submitAssetRequest(
        dto.symbol,
        dto.assetClass,
        userId,
      );

      return {
        id: pendingAsset.id,
        symbol: pendingAsset.symbol,
        status: pendingAsset.status ?? 'pending',
        message: `Asset request submitted successfully. We will review and add ${dto.symbol} to our registry soon.`,
      };
    } catch (error) {
      if ((error as Error).message.includes('already requested')) {
        throw new ConflictException((error as Error).message);
      }
      throw error;
    }
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
