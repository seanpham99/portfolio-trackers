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
} from '@workspace/shared-types/api';
import { Portfolio } from './portfolio.entity';
import { AuthGuard } from './guards/auth.guard';
import { UserId } from './decorators/user-id.decorator';

/**
 * Controller for portfolio management endpoints
 * All routes require authentication
 */
@Controller('portfolios')
@UseGuards(AuthGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

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
   * GET /portfolios/:id/holdings - Get holdings for specific portfolio
   */
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
