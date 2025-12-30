import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@workspace/database-types';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import {
  HoldingDto,
  CalculationMethod,
  PortfolioSummaryDto,
  CreateTransactionDto,
  AssetDetailsResponseDto,
} from '@workspace/api-types';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../common/cache';

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

    if (!data) {
      throw new Error('Failed to create portfolio');
    }

    // Invalidate portfolios list cache for user
    await this.cacheService.del(`portfolios:${userId}`);

    return data;
  }

  /**
   * Find all portfolios for the authenticated user
   */
  async findAll(userId: string): Promise<PortfolioSummaryDto[]> {
    // Check cache first
    const cacheKey = `portfolios:${userId}`;
    const cached = await this.cacheService.get<PortfolioSummaryDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // First, fetch portfolios ONLY (lightweight query)
    const portfoliosResult = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (portfoliosResult.error) throw portfoliosResult.error;

    const portfolios = portfoliosResult.data ?? [];

    // EARLY RETURN: If no portfolios, skip expensive transactions query
    if (portfolios.length === 0) {
      await this.cacheService.set(cacheKey, []);
      return [];
    }

    // Only fetch transactions if portfolios exist
    const transactionsResult = await this.supabase
      .from('transactions')
      .select(
        `
        asset_id,
        quantity,
        price,
        type,
        portfolio_id,
        assets (
          id,
          symbol,
          name_en,
          name_local,
          asset_class,
          market,
          currency
        ),
        portfolios!inner (
          user_id
        )
      `,
      )
      .eq('portfolios.user_id', userId);

    if (transactionsResult.error) throw transactionsResult.error;

    const allTransactions = transactionsResult.data ?? [];

    const portfoliosWithSummary = portfolios.map((portfolio) => {
      // Filter transactions for this portfolio
      const portfolioTxs = allTransactions.filter(
        (tx) => tx.portfolio_id === portfolio.id,
      );

      // Calculate holdings
      const holdings = this.calculateHoldings(portfolioTxs);

      // Calculate Net Worth
      const netWorth = holdings.reduce(
        (sum, h) => sum + h.total_quantity * h.avg_cost,
        0,
      );

      return {
        ...portfolio,
        netWorth,
        change24h: 0, // Placeholder: Requires historical price service
        change24hPercent: 0, // Placeholder
        allocation: [], // Placeholder
      };
    });

    // Cache the result
    await this.cacheService.set(cacheKey, portfoliosWithSummary);

    return portfoliosWithSummary;
  }

  /**
   * Find a specific portfolio by id
   */
  async findOne(userId: string, id: string): Promise<PortfolioSummaryDto> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) {
      this.handleError(error, id);
    }

    if (!data) {
      throw new NotFoundException(`Portfolio ${id} not found`);
    }

    // Calculate details on the fly to ensure consistency
    // We fetch transactions for this specific portfolio
    const { data: transactions, error: txError } = await this.supabase
      .from('transactions')
      .select(
        `
        asset_id,
        quantity,
        price,
        type,
        portfolio_id,
        assets (
          id,
          symbol,
          name_en,
          name_local,
          asset_class,
          market,
          currency
        ),
        portfolios!inner (
          user_id
        )
      `,
      )
      .eq('portfolio_id', id) // Specific portfolio
      .eq('portfolios.user_id', userId); // Security check via join

    if (txError) throw txError;

    const holdings = this.calculateHoldings(transactions || []);
    const netWorth = holdings.reduce(
      (sum, h) => sum + h.total_quantity * h.avg_cost,
      0,
    );

    return {
      ...data,
      netWorth,
      change24h: 0,
      change24hPercent: 0,
      allocation: [],
    };
  }

  /**
   * Update a portfolio
   */
  async update(
    userId: string,
    id: string,
    updateDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    // Check if exists first
    await this.findOne(userId, id);

    const { data, error } = await this.supabase
      .from('portfolios')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, updateDto.name || id);
    }

    if (!data) {
      throw new Error('Failed to update portfolio');
    }

    // Invalidate specific portfolio and list
    await this.cacheService.invalidatePortfolio(userId, id);

    return data;
  }

  /**
   * Remove a portfolio
   */
  async remove(userId: string, id: string): Promise<void> {
    // Check if exists first
    await this.findOne(userId, id);

    const { error } = await this.supabase
      .from('portfolios')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Invalidate caches
    await this.cacheService.invalidatePortfolio(userId, id);
  }

  private handleError(error: PostgrestError, resource: string) {
    if (error.code === 'PGRST116') {
      throw new NotFoundException(`Portfolio ${resource} not found`);
    }
    if (error.code === '23505') {
      throw new ConflictException('Portfolio with this name already exists');
    }
    throw error;
  }

  /**
   * Get aggregated holdings for user (all portfolios or specific one)
   */
  async getHoldings(
    userId: string,
    portfolioId?: string,
  ): Promise<HoldingDto[]> {
    // Check cache first (different keys for filtered vs all)
    const cacheKey = portfolioId
      ? `holdings:${userId}:${portfolioId}`
      : `holdings:${userId}`;
    const cached = await this.cacheService.get<HoldingDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query transactions
    let query = this.supabase
      .from('transactions')
      .select(
        `
        asset_id,
        quantity,
        price,
        type,
        portfolio_id,
        assets (
          id,
          symbol,
          name_en,
          name_local,
          asset_class,
          market,
          currency
        ),
        portfolios!inner (
          user_id
        )
      `,
      )
      .eq('portfolios.user_id', userId);

    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw error;
    }

    const holdings = this.calculateHoldings(transactions || []);

    // Cache result
    await this.cacheService.set(cacheKey, holdings);

    return holdings;
  }

  /**
   * Helper to aggregates transactions into holdings using Weighted Average Cost
   */
  private calculateHoldings(transactions: any[]): HoldingDto[] {
    const holdingsMap = new Map<
      string,
      {
        qty: number;
        cost: number;
        asset: any;
      }
    >();

    for (const tx of transactions || []) {
      if (!tx.assets || (Array.isArray(tx.assets) && tx.assets.length === 0))
        continue;

      const assetId = tx.asset_id;
      if (!holdingsMap.has(assetId)) {
        holdingsMap.set(assetId, {
          qty: 0,
          cost: 0,
          asset: Array.isArray(tx.assets) ? tx.assets[0] : tx.assets,
        });
      }
      const entry = holdingsMap.get(assetId)!;

      if (tx.type === 'BUY') {
        entry.qty += tx.quantity;
        entry.cost += tx.quantity * tx.price;
      } else if (tx.type === 'SELL') {
        // Weighted Average Cost Logic
        const currentAvg = entry.qty > 0 ? entry.cost / entry.qty : 0;
        entry.qty -= tx.quantity;
        entry.cost -= tx.quantity * currentAvg;
      }

      if (Math.abs(entry.qty) < 0.000001) {
        entry.qty = 0;
        entry.cost = 0;
      }
    }

    // Convert to DTO
    return Array.from(holdingsMap.values())
      .map((entry) => {
        return {
          asset_id: entry.asset.id,
          symbol: entry.asset.symbol,
          name:
            entry.asset.name_en || entry.asset.name_local || entry.asset.symbol,
          asset_class: entry.asset.asset_class,
          market: entry.asset.market ?? undefined,
          currency: entry.asset.currency,
          total_quantity: entry.qty,
          avg_cost: entry.qty > 0 ? entry.cost / entry.qty : 0,
          calculationMethod: CalculationMethod.WEIGHTED_AVG,
          dataSource: 'Manual Entry',
        };
      })
      .filter((h) => h.total_quantity > 0);
  }

  /**
   * Add a transaction to a portfolio
   */
  async addTransaction(
    userId: string,
    portfolioId: string,
    createDto: CreateTransactionDto,
  ): Promise<any> {
    // Verify portfolio ownership
    await this.findOne(userId, portfolioId);

    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        portfolio_id: portfolioId,
        asset_id: createDto.asset_id,
        type: createDto.type,
        quantity: createDto.quantity,
        price: createDto.price,
        fee: createDto.fee ?? 0,
        transaction_date:
          createDto.transaction_date ?? new Date().toISOString(),
        notes: createDto.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Invalidate relevant caches
    await this.cacheService.invalidatePortfolio(userId, portfolioId);

    return data;
  }
  /**
   * Get detailed asset performance and history for a specific portfolio
   */
  async getAssetDetails(
    userId: string,
    portfolioId: string,
    symbol: string,
  ): Promise<AssetDetailsResponseDto> {
    // 1. Verify portfolio exists and belongs to user
    await this.findOne(userId, portfolioId);

    // 2. Fetch all transactions for this symbol in this portfolio to determine the asset_id
    // This resolves ambiguity if the same symbol exists across different markets
    const { data: transactions, error: txError } = await this.supabase
      .from('transactions')
      .select(
        `
        id,
        type,
        quantity,
        price,
        fee,
        transaction_date,
        notes,
        assets!inner (
            id,
            symbol,
            name_en,
            name_local,
            asset_class,
            market,
            currency
        )
      `,
      )
      .eq('portfolio_id', portfolioId)
      .eq('assets.symbol', symbol)
      .order('transaction_date', { ascending: true });

    if (txError) throw txError;
    if (!transactions || transactions.length === 0) {
      throw new NotFoundException(
        `No transactions found for asset ${symbol} in this portfolio`,
      );
    }

    // Since we filtered by assets!inner.symbol, all transactions belong to the same unique asset in this context
    const asset = (transactions[0] as any).assets;

    // 3. Calculate Metrics
    let totalQty = 0;
    let totalCost = 0;
    let realizedPL = 0;

    const txDtos = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type as 'BUY' | 'SELL',
      quantity: tx.quantity,
      price: tx.price,
      date: tx.transaction_date,
      fee: tx.fee ?? 0,
      notes: tx.notes ?? undefined,
    }));

    for (const tx of transactions) {
      if (tx.type === 'BUY') {
        totalQty += tx.quantity;
        totalCost += tx.quantity * tx.price + (tx.fee || 0);
      } else if (tx.type === 'SELL') {
        const currentAvgCost = totalQty > 0 ? totalCost / totalQty : 0;
        const costBasis = currentAvgCost * tx.quantity;
        const proceeds = tx.quantity * tx.price - (tx.fee || 0);

        realizedPL += proceeds - costBasis;

        totalQty -= tx.quantity;
        totalCost -= costBasis;
      }
    }

    // Handle float precision
    if (Math.abs(totalQty) < 0.000001) {
      totalQty = 0;
      totalCost = 0;
    }

    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
    const currentPrice = transactions[transactions.length - 1].price;
    const currentValue = totalQty * currentPrice;
    const unrealizedPL = currentValue - totalQty * avgCost;

    return {
      details: {
        asset_id: asset.id,
        symbol: asset.symbol,
        name: asset.name_en || asset.name_local || asset.symbol,
        asset_class: asset.asset_class,
        market: asset.market ?? 'Unknown',
        currency: asset.currency,
        total_quantity: totalQty,
        avg_cost: avgCost,
        current_price: currentPrice,
        current_value: currentValue,
        total_return_abs: unrealizedPL + realizedPL,
        total_return_pct:
          totalCost > 0 ? ((unrealizedPL + realizedPL) / totalCost) * 100 : 0,
        unrealized_pl: unrealizedPL,
        unrealized_pl_pct:
          avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0,
        realized_pl: realizedPL,
        asset_gain: unrealizedPL,
        fx_gain: 0,
        calculation_method: CalculationMethod.WEIGHTED_AVG,
        last_updated: new Date().toISOString(),
      },
      transactions: txDtos,
    };
  }
}
