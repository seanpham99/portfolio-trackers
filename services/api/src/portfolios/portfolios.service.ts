import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@workspace/shared-types/database';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import {
  HoldingDto,
  CalculationMethod,
  PortfolioSummaryDto,
  CreateTransactionDto,
  AssetDetailsResponseDto,
} from '@workspace/shared-types/api';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../common/cache';
import { MarketDataService } from '../market-data';

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
    private readonly marketDataService: MarketDataService,
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
        fee,
        total,
        exchange_rate,
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

    const portfoliosWithSummary = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Filter transactions for this portfolio
        const portfolioTxs = allTransactions.filter(
          (tx) => tx.portfolio_id === portfolio.id,
        );

        // Fetch prices for assets in this portfolio
        const uniqueAssets = new Map<
          string,
          { symbol: string; market: string; assetClass: string }
        >();
        portfolioTxs.forEach((tx) => {
          if (tx.assets && !Array.isArray(tx.assets)) {
            const asset = tx.assets as any;
            uniqueAssets.set(asset.symbol, {
              symbol: asset.symbol,
              market: asset.market,
              assetClass: asset.asset_class,
            });
          }
        });

        // Resolve prices
        const priceMap = new Map<string, number>();
        await Promise.all(
          Array.from(uniqueAssets.values()).map(async (asset) => {
            const price = await this.marketDataService.getCurrentPrice(
              asset.symbol,
              asset.market,
              asset.assetClass,
            );
            if (price !== null) {
              priceMap.set(asset.symbol, price);
            }
          }),
        );

        // Calculate holdings with prices
        const holdings = this.calculateHoldings(portfolioTxs, priceMap);

        // Calculate Net Worth (Sum of Market Values)
        const netWorth = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

        // Calculate Total Gain (Unrealized + Realized)
        const totalUnrealizedPL = holdings.reduce(
          (sum, h) => sum + (h.pl || 0),
          0,
        );
        const totalRealizedPL = holdings.reduce(
          (sum, h) => sum + (h.realized_pl || 0),
          0,
        );

        // Total Cost Basis
        const totalCostBasis = holdings.reduce(
          (sum, h) => sum + h.total_quantity * h.avg_cost,
          0,
        );

        return {
          ...portfolio,
          netWorth,
          totalGain: totalUnrealizedPL + totalRealizedPL,
          unrealizedPL: totalUnrealizedPL,
          realizedPL: totalRealizedPL,
          totalCostBasis,
          change24h: 0, // Placeholder: Requires historical price
          change24hPercent: 0, // Placeholder
          allocation: [], // Placeholder
        };
      }),
    );

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
        fee,
        total,
        exchange_rate,
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

    // Fetch prices
    const uniqueAssets = new Set<string>();
    (transactions || []).forEach((tx) => {
      if (tx.assets && !Array.isArray(tx.assets)) {
        uniqueAssets.add((tx.assets as any).symbol);
      }
    });

    const priceMap = new Map<string, number>();
    await Promise.all(
      Array.from(uniqueAssets).map(async (symbol) => {
        const txWithAsset = (transactions || []).find(
          (t) => (t.assets as any)?.symbol === symbol,
        );
        const market = (txWithAsset?.assets as any)?.market;
        const price = await this.marketDataService.getCurrentPrice(
          symbol,
          market,
        );
        if (price !== null) {
          priceMap.set(symbol, price);
        }
      }),
    );

    const holdings = this.calculateHoldings(transactions || [], priceMap);

    // Calculate Metrics
    const netWorth = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const totalUnrealizedPL = holdings.reduce((sum, h) => sum + (h.pl || 0), 0);
    const totalRealizedPL = holdings.reduce(
      (sum, h) => sum + (h.realized_pl || 0),
      0,
    );
    const totalCostBasis = holdings.reduce(
      (sum, h) => sum + h.total_quantity * h.avg_cost,
      0,
    );

    return {
      ...data,
      netWorth,
      totalGain: totalUnrealizedPL + totalRealizedPL,
      unrealizedPL: totalUnrealizedPL,
      realizedPL: totalRealizedPL,
      totalCostBasis,
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
        fee,
        total,
        exchange_rate,
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

    // Fetch prices
    const uniqueAssets = new Set<string>();
    (transactions || []).forEach((tx) => {
      if (tx.assets && !Array.isArray(tx.assets)) {
        uniqueAssets.add((tx.assets as any).symbol);
      }
    });

    const priceMap = new Map<string, number>();
    await Promise.all(
      Array.from(uniqueAssets).map(async (symbol) => {
        const txWithAsset = (transactions || []).find(
          (t) => (t.assets as any)?.symbol === symbol,
        );
        const market = (txWithAsset?.assets as any)?.market;
        const price = await this.marketDataService.getCurrentPrice(
          symbol,
          market,
        );
        if (price !== null) {
          priceMap.set(symbol, price);
        }
      }),
    );

    const holdings = this.calculateHoldings(transactions || [], priceMap);

    // Cache result
    await this.cacheService.set(cacheKey, holdings);

    return holdings;
  }

  /**
   * Helper to aggregates transactions into holdings using FIFO Logic
   */
  private calculateHoldings(
    transactions: any[],
    priceMap: Map<string, number> = new Map(),
  ): HoldingDto[] {
    // Map assetId -> FIFO Lots Queue & Metrics
    const lotsMap = new Map<
      string,
      {
        lots: { qty: number; cost: number }[];
        realizedPL: number;
        lastPrice: number;
        asset: any;
      }
    >();

    for (const tx of transactions || []) {
      if (!tx.assets || (Array.isArray(tx.assets) && tx.assets.length === 0))
        continue;

      const assetId = tx.asset_id as string;
      if (!lotsMap.has(assetId)) {
        lotsMap.set(assetId, {
          lots: [],
          realizedPL: 0,
          lastPrice: 0,
          asset: Array.isArray(tx.assets) ? tx.assets[0] : tx.assets,
        });
      }
      const entry = lotsMap.get(assetId)!;

      // Update last price seen in transactions (fallback)
      entry.lastPrice = tx.price;

      if (tx.type === 'BUY') {
        // FR2.3: Base Cost = Asset Total (calculated by DB) * Exchange Rate
        const AssetTotal = tx.total ?? tx.quantity * tx.price + (tx.fee || 0);
        const costBasis = AssetTotal * (tx.exchange_rate ?? 1);
        entry.lots.push({ qty: tx.quantity, cost: costBasis });
      } else if (tx.type === 'SELL') {
        let qtyToSell = tx.quantity;
        let costBasisRemoved = 0;

        // FIFO Consumption
        while (qtyToSell > 0.00000001 && entry.lots.length > 0) {
          const currentLot = entry.lots[0];
          if (!currentLot) break;

          if (currentLot.qty > qtyToSell) {
            // Partial consumption
            const ratio = qtyToSell / currentLot.qty;
            const costToRemove = currentLot.cost * ratio;

            currentLot.qty -= qtyToSell;
            currentLot.cost -= costToRemove;
            costBasisRemoved += costToRemove;
            qtyToSell = 0;
          } else {
            // Full consumption
            costBasisRemoved += currentLot.cost;
            qtyToSell -= currentLot.qty;
            entry.lots.shift();
          }
        }

        // Calculate Realized P/L
        const AssetTotal = tx.total ?? tx.quantity * tx.price - (tx.fee || 0);
        const proceeds = AssetTotal * (tx.exchange_rate ?? 1);
        entry.realizedPL += proceeds - costBasisRemoved;
      }
    }

    // Convert to DTO
    return Array.from(lotsMap.values())
      .map((entry) => {
        const totalQty = entry.lots.reduce((sum, lot) => sum + lot.qty, 0);
        const totalCost = entry.lots.reduce((sum, lot) => sum + lot.cost, 0);
        const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

        // Determine Market Price: API Price > Last Tx Price
        const apiPrice = priceMap.get(entry.asset.symbol);
        const marketPrice = apiPrice ?? entry.lastPrice;

        const value = totalQty * marketPrice;
        const unrealizedPL = value - totalCost;

        return {
          asset_id: entry.asset.id,
          symbol: entry.asset.symbol,
          name:
            entry.asset.name_en || entry.asset.name_local || entry.asset.symbol,
          asset_class: entry.asset.asset_class,
          market: entry.asset.market ?? undefined,
          currency: entry.asset.currency,
          total_quantity: totalQty,
          avg_cost: avgCost,

          // Enhanced Metrics
          price: marketPrice,
          value: value,
          pl: unrealizedPL,
          pl_percent: totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0,
          realized_pl: entry.realizedPL,

          calculationMethod: CalculationMethod.FIFO,
          dataSource: apiPrice ? 'Market Data' : 'Last Transaction',
        };
      })
      .filter((h) => h.total_quantity > 0.000001); // Filter out zero balances
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
        exchange_rate: createDto.exchange_rate ?? 1,
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
        total,
        exchange_rate,
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

    // 3. FIFO Calculation Engine
    const lots: { quantity: number; cost: number; date: string }[] = [];
    let totalQty = 0;
    let realizedPL = 0;

    const txDtos = transactions.map((tx: any) => ({
      id: tx.id,
      type: tx.type as 'BUY' | 'SELL',
      quantity: tx.quantity,
      price: tx.price,
      date: tx.transaction_date,
      fee: tx.fee ?? 0,
      notes: tx.notes ?? undefined,
      exchange_rate: tx.exchange_rate ?? 1,
    }));

    for (const tx of transactions) {
      if (tx.type === 'BUY') {
        // FR2.3: Base Cost = Asset Total * Exchange Rate
        const AssetTotal = tx.total ?? tx.quantity * tx.price + (tx.fee || 0);
        const costBasis = AssetTotal * (tx.exchange_rate ?? 1);

        lots.push({
          quantity: tx.quantity,
          cost: costBasis,
          date: tx.transaction_date,
        });
        totalQty += tx.quantity;
      } else if (tx.type === 'SELL') {
        let qtyToSell = tx.quantity;
        let costBasisRemoved = 0;

        // FIFO: Consume from oldest lots
        while (qtyToSell > 0.00000001 && lots.length > 0) {
          const currentLot = lots[0]; // Peek oldest
          if (!currentLot) break; // Safety check

          if (currentLot.quantity > qtyToSell) {
            // Partial consumption of lot
            const ratio = qtyToSell / currentLot.quantity;
            const costPortion = currentLot.cost * ratio;

            costBasisRemoved += costPortion;
            currentLot.quantity -= qtyToSell;
            currentLot.cost -= costPortion;
            qtyToSell = 0;
          } else {
            // Full consumption of lot
            costBasisRemoved += currentLot.cost;
            qtyToSell -= currentLot.quantity;
            lots.shift(); // Remove empty lot
          }
        }

        // Calculate Realized P/L for this transaction
        // Proceeds (Base) = Asset Total * Exchange Rate
        const AssetTotal = tx.total ?? tx.quantity * tx.price - (tx.fee || 0);
        const proceeds = AssetTotal * (tx.exchange_rate ?? 1);

        realizedPL += proceeds - costBasisRemoved;
        totalQty -= tx.quantity;
      }
    }

    if (Math.abs(totalQty) < 0.000001) {
      totalQty = 0;
    }

    // Calculate Remaining Cost Basis from lots
    const remainingCostBasis = lots.reduce((sum, lot) => sum + lot.cost, 0);

    const avgCost = totalQty > 0 ? remainingCostBasis / totalQty : 0;
    const lastTx = transactions[transactions.length - 1];
    if (!lastTx) throw new Error('Unexpected error: No transactions found');

    // Fetch current price
    const apiPrice = await this.marketDataService.getCurrentPrice(
      asset.symbol,
      asset.market,
      asset.asset_class,
    );
    const currentPrice = apiPrice ?? lastTx.price;

    // Current Value (Base) = Qty * Price
    const currentValue = totalQty * currentPrice;

    // Unrealized P/L = Current Value - Remaining Cost Basis
    const unrealizedPL = currentValue - remainingCostBasis;

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
          remainingCostBasis > 0
            ? ((unrealizedPL + realizedPL) / remainingCostBasis) * 100
            : 0,
        unrealized_pl: unrealizedPL,
        unrealized_pl_pct:
          avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0,
        realized_pl: realizedPL,
        asset_gain: unrealizedPL, // TODO: Separate FX Gain when live rates available
        fx_gain: 0,
        calculation_method: CalculationMethod.FIFO,
        last_updated: new Date().toISOString(),
      },
      transactions: txDtos,
    };
  }
}
