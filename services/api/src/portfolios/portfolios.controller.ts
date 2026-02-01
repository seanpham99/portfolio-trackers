import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import {
  CreateTransactionDto,
  HoldingDto,
  PortfolioSummaryDto,
  AssetDetailsResponseDto,
  ApiResponse,
  createApiResponse,
  PortfolioHistoryResponseDto,
} from '@workspace/shared-types';
import { Portfolio } from './portfolio.entity';
import { AuthGuard } from './guards/auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { UserId } from './decorators/user-id.decorator';
import { SnapshotService } from './snapshot.service';
import { TierValidationGuard } from '../common/guards/tier-validation.guard';

/**
 * Controller for portfolio management endpoints
 * All routes require authentication
 */
@Controller('portfolios')
@UseGuards(AuthGuard, TierValidationGuard)
export class PortfoliosController {
  constructor(
    private readonly portfoliosService: PortfoliosService,
    private readonly snapshotService: SnapshotService,
  ) {}

  /**
   * POST /portfolios - Create a new portfolio
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @UserId() userId: string,
    @Body() createDto: CreatePortfolioDto,
  ): Promise<ApiResponse<Portfolio>> {
    const data = await this.portfoliosService.create(userId, createDto);
    return createApiResponse(data, new Date());
  }

  /**
   * GET /portfolios - Get all portfolios for authenticated user
   */
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ): Promise<ApiResponse<PortfolioSummaryDto[]>> {
    const { data, meta } = await this.portfoliosService.findAll(
      userId,
      refresh,
    );
    return createApiResponse(data, meta.staleness);
  }

  /**
   * GET /portfolios/holdings - Get aggregated holdings for all portfolios
   */
  @Get('holdings')
  async getHoldings(
    @UserId() userId: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ): Promise<ApiResponse<HoldingDto[]>> {
    const { data, meta } = await this.portfoliosService.getHoldings(
      userId,
      undefined,
      refresh,
    );
    return createApiResponse(data, meta.staleness);
  }

  /**
   * GET /portfolios/:id/history - Get portfolio history
   */
  @Get(':id/history')
  async getHistory(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('range') range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1M',
  ): Promise<ApiResponse<PortfolioHistoryResponseDto['data']>> {
    const { data, meta } = await this.snapshotService.getHistory(
      userId,
      id,
      range,
    );
    return createApiResponse(data, meta.staleness || new Date());
  }

  /**
   * POST /portfolios/snapshots/batch - Trigger batch snapshot for all portfolios
   * Protected by API key (for Airflow/service-to-service calls)
   */
  @Post('snapshots/batch')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerBatchSnapshot(): Promise<
    ApiResponse<{ started: boolean; portfolioCount: number; message: string }>
  > {
    const result = await this.snapshotService.captureAll();
    return createApiResponse(result, new Date());
  }

  /**
   * GET /portfolios/:id/assets/:symbol/details - Get details for asset in portfolio
   */
  @Get(':id/assets/:symbol/details')
  async getAssetDetails(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('symbol') symbol: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ): Promise<ApiResponse<AssetDetailsResponseDto>> {
    const { data, meta } = await this.portfoliosService.getAssetDetails(
      userId,
      id,
      symbol,
      refresh,
    );
    return createApiResponse(data, meta.staleness);
  }

  /**
   * GET /portfolios/:id/holdings - Get holdings for specific portfolio
   */
  @Get(':id/holdings')
  async getPortfolioHoldings(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ): Promise<ApiResponse<HoldingDto[]>> {
    const { data, meta } = await this.portfoliosService.getHoldings(
      userId,
      id,
      refresh,
    );
    return createApiResponse(data, meta.staleness);
  }

  /**
   * GET /portfolios/:id - Get a specific portfolio by ID
   * Also triggers a snapshot capture if the last one was > 24h ago
   */
  @Get(':id')
  async findOne(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ): Promise<ApiResponse<PortfolioSummaryDto>> {
    const { data, meta } = await this.portfoliosService.findOne(
      userId,
      id,
      refresh,
    );

    // Lazy Snapshot Trigger (Fire and Forget)
    // We don't await this to keep the API response fast
    this.snapshotService.shouldCapture(id).then((should) => {
      if (should) {
        this.snapshotService.captureSnapshot(userId, id, 'user_view');
      }
    });

    return createApiResponse(data, meta.staleness);
  }

  /**
   * PUT /portfolios/:id - Update a portfolio
   */
  @Put(':id')
  async update(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePortfolioDto,
  ): Promise<ApiResponse<Portfolio>> {
    const data = await this.portfoliosService.update(userId, id, updateDto);
    return createApiResponse(data, new Date());
  }

  /**
   * DELETE /portfolios/:id - Delete a portfolio
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.portfoliosService.remove(userId, id);
  }

  /**
   * POST /portfolios/:id/transactions - Add a transaction
   */
  @Post(':id/transactions')
  @HttpCode(HttpStatus.CREATED)
  async addTransaction(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateTransactionDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.portfoliosService.addTransaction(
      userId,
      id,
      createDto,
    );
    return createApiResponse(data, new Date());
  }
}
