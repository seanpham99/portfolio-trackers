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
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import { CreateTransactionDto } from '@repo/api-types';
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
  ): Promise<Portfolio> {
    return this.portfoliosService.create(userId, createDto);
  }

  /**
   * GET /portfolios - Get all portfolios for authenticated user
   */
  @Get()
  async findAll(@UserId() userId: string): Promise<Portfolio[]> {
    return this.portfoliosService.findAll(userId);
  }

  /**
   * GET /portfolios/:id - Get a specific portfolio by ID
   */
  @Get(':id')
  async findOne(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Portfolio> {
    return this.portfoliosService.findOne(userId, id);
  }

  /**
   * PUT /portfolios/:id - Update a portfolio
   */
  @Put(':id')
  async update(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    return this.portfoliosService.update(userId, id, updateDto);
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
  ): Promise<any> {
    return this.portfoliosService.addTransaction(userId, id, createDto);
  }
}
