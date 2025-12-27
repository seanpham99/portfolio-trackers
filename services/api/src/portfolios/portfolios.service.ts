import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@repo/database-types';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import { CreateTransactionDto } from '@repo/api-types';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../cache';

/**
 * Service for portfolio CRUD operations
 * Uses Supabase client with RLS for data access
 * Implements cache invalidation per Architecture Decision 1.3
 */
@Injectable()
export class PortfoliosService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new portfolio for the authenticated user
   */
  async create(
    userId: string,
    createDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: createDto.name,
        base_currency: createDto.base_currency,
        description: createDto.description ?? null,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, createDto.name);
    }

    // Invalidate portfolios list cache for user
    await this.cacheService.del(`portfolios:${userId}`);

    return data;
  }

  /**
   * Find all portfolios for the authenticated user
   */
  async findAll(userId: string): Promise<Portfolio[]> {
    // Check cache first
    const cacheKey = `portfolios:${userId}`;
    const cached = await this.cacheService.get<Portfolio[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const portfolios = data ?? [];

    // Cache the result
    await this.cacheService.set(cacheKey, portfolios);

    return portfolios;
  }

  /**
   * Find a single portfolio by ID
   */
  async findOne(userId: string, id: string): Promise<Portfolio> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Portfolio with ID "${id}" not found`);
      }
      throw error;
    }

    return data;
  }

  /**
   * Update an existing portfolio
   */
  async update(
    userId: string,
    id: string,
    updateDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    // First verify the portfolio exists and belongs to the user
    await this.findOne(userId, id);

    const { data, error } = await this.supabase
      .from('portfolios')
      .update({
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.base_currency !== undefined && {
          base_currency: updateDto.base_currency,
        }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.handleError(error, updateDto.name);
    }

    // Invalidate caches
    await this.cacheService.invalidatePortfolio(userId, id);

    return data;
  }

  /**
   * Delete a portfolio
   */
  async remove(userId: string, id: string): Promise<void> {
    // First verify the portfolio exists and belongs to the user
    await this.findOne(userId, id);

    const { error } = await this.supabase
      .from('portfolios')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Invalidate caches
    await this.cacheService.invalidatePortfolio(userId, id);
  }

  /**
   * Handle Supabase errors
   */
  private handleError(error: PostgrestError, name?: string): never {
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new ConflictException(
        `Portfolio with name "${name}" already exists`,
      );
    }
    throw error;
  }

  /**
   * Add a transaction to a portfolio
   * Implements cache invalidation per Architecture Decision 1.3
   */
  async addTransaction(
    userId: string,
    portfolioId: string,
    createDto: CreateTransactionDto,
  ): Promise<any> {
    // 1. Verify portfolio ownership
    await this.findOne(userId, portfolioId);

    // 2. Validate DTO portfolio_id matches URL param
    if (createDto.portfolio_id !== portfolioId) {
      throw new ConflictException('Portfolio ID in body does not match URL parameter');
    }

    // 3. Insert transaction
    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        portfolio_id: portfolioId,
        asset_id: createDto.asset_id,
        type: createDto.type,
        quantity: createDto.quantity,
        price: createDto.price,
        fee: createDto.fee ?? 0,
        transaction_date: createDto.transaction_date ?? new Date().toISOString(),
        notes: createDto.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 4. Invalidate Upstash cache keys for the portfolio (Decision 1.3)
    await this.cacheService.invalidatePortfolio(userId, portfolioId);

    return data;
  }
}
