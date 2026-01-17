import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  Database,
  Transactions,
  Assets,
  Portfolios,
} from '@workspace/shared-types/database';
import { Decimal } from 'decimal.js';
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
 * Type representing a transaction joined with its asset data
 * Uses shared types from @workspace/shared-types/database
 */
export type TransactionWithAsset = Transactions & {
  assets: Assets | null;
};

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

    return data as Portfolio;
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

    const portfolios = (portfoliosResult.data as Portfolios[]) ?? [];

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
        *,
        assets (
          *
        ),
        portfolios!inner (
          user_id
        )
      `,
      )
      .eq('portfolios.user_id', userId);

    if (transactionsResult.error) throw transactionsResult.error;

    // Use the explicit join type
    const allTransactions =
      (transactionsResult.data as unknown as TransactionWithAsset[]) ?? [];

    const portfoliosWithSummary = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Filter transactions for this portfolio
        const portfolioTxs = allTransactions.filter(
          (tx) => tx.portfolio_id === portfolio.id,
        );

        // Fetch prices for assets in this portfolio
        const uniqueAssets = new Map<
          string,
          { symbol: string; market: string | null; assetClass: string }
        >();
        portfolioTxs.forEach((tx) => {
          if (tx.assets && !Array.isArray(tx.assets)) {
            const asset = tx.assets;
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
              asset.market || undefined,
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

    const portfolio = data as Portfolios;

    // We fetch transactions for this specific portfolio
    const { data: transactions, error: txError } = await this.supabase
      .from('transactions')
      .select(
        `
        *,
        assets (
          *
        ),
        portfolios!inner (
          user_id
        )
      `,
      )
      .eq('portfolio_id', id)
      .eq('portfolios.user_id', userId);

    if (txError) throw txError;

    const portfolioTxs =
      (transactions as unknown as TransactionWithAsset[]) ?? [];

    // Fetch prices
    const uniqueAssets = new Set<string>();
    portfolioTxs.forEach((tx) => {
      if (tx.assets && !Array.isArray(tx.assets)) {
        uniqueAssets.add(tx.assets.symbol);
      }
    });

    const priceMap = new Map<string, number>();
    await Promise.all(
      Array.from(uniqueAssets).map(async (symbol) => {
        const txWithAsset = portfolioTxs.find(
          (t) => t.assets?.symbol === symbol,
        );
        const asset = txWithAsset?.assets;

        if (asset) {
          const price = await this.marketDataService.getCurrentPrice(
            symbol,
            asset.market ?? undefined,
            asset.asset_class,
          );
          if (price !== null) {
            priceMap.set(symbol, price);
          }
        }
      }),
    );

    const holdings = this.calculateHoldings(portfolioTxs, priceMap);

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
      ...portfolio,
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

    await this.cacheService.invalidatePortfolio(userId, id);

    return data as Portfolio;
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
    // Check cache first
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
        *,
        assets (
          *
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

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const transactions = (data as unknown as TransactionWithAsset[]) ?? [];

    // Fetch prices
    const uniqueAssets = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.assets && !Array.isArray(tx.assets)) {
        uniqueAssets.add(tx.assets.symbol);
      }
    });

    const priceMap = new Map<string, number>();
    await Promise.all(
      Array.from(uniqueAssets).map(async (symbol) => {
        const txWithAsset = transactions.find(
          (t) => t.assets?.symbol === symbol,
        );
        const asset = txWithAsset?.assets;

        if (asset) {
          const price = await this.marketDataService.getCurrentPrice(
            symbol,
            asset.market ?? undefined,
            asset.asset_class,
          );
          if (price !== null) {
            priceMap.set(symbol, price);
          }
        }
      }),
    );

    const holdings = this.calculateHoldings(transactions, priceMap);

    // Cache result
    await this.cacheService.set(cacheKey, holdings);

    return holdings;
  }

  /**
   * Helper to aggregates transactions into holdings using FIFO Logic
   */
  private calculateHoldings(
    transactions: TransactionWithAsset[],
    priceMap: Map<string, number> = new Map(),
  ): HoldingDto[] {
    const lotsMap = new Map<
      string,
      {
        lots: { qty: number; cost: number }[];
        realizedPL: number;
        lastPrice: number;
        asset: Assets;
      }
    >();

    for (const tx of transactions) {
      if (!tx.assets || Array.isArray(tx.assets)) continue;

      const asset = tx.assets;
      const assetId = tx.asset_id;

      if (!lotsMap.has(assetId)) {
        lotsMap.set(assetId, {
          lots: [],
          realizedPL: 0,
          lastPrice: 0,
          asset: asset,
        });
      }
      const entry = lotsMap.get(assetId)!;

      entry.lastPrice = tx.price;

      if (tx.type === 'BUY') {
        const qty = new Decimal(tx.quantity);
        const price = new Decimal(tx.price);
        const fee = new Decimal(tx.fee || 0);
        const exchangeRate = new Decimal(tx.exchange_rate ?? 1);

        const assetTotal = qty.times(price).plus(fee);
        const costBasis = assetTotal.times(exchangeRate);
        entry.lots.push({ qty: qty.toNumber(), cost: costBasis.toNumber() });
      } else if (tx.type === 'SELL') {
        let qtyToSell = new Decimal(tx.quantity).toNumber();
        let costBasisRemoved = new Decimal(0);

        while (qtyToSell > 0.00000001 && entry.lots.length > 0) {
          const currentLot = entry.lots[0];
          if (!currentLot) break;

          if (currentLot.qty > qtyToSell) {
            const ratio = qtyToSell / currentLot.qty;
            const costToRemove = new Decimal(currentLot.cost).times(ratio);

            currentLot.qty -= qtyToSell;
            currentLot.cost = new Decimal(currentLot.cost)
              .minus(costToRemove)
              .toNumber();
            costBasisRemoved = costBasisRemoved.plus(costToRemove);
            qtyToSell = 0;
          } else {
            costBasisRemoved = costBasisRemoved.plus(currentLot.cost);
            qtyToSell -= currentLot.qty;
            entry.lots.shift();
          }
        }

        const qty = new Decimal(tx.quantity);
        const price = new Decimal(tx.price);
        const fee = new Decimal(tx.fee || 0);
        const exchangeRate = new Decimal(tx.exchange_rate ?? 1);

        const assetTotal = qty.times(price).minus(fee);
        const proceeds = assetTotal.times(exchangeRate);
        entry.realizedPL = new Decimal(entry.realizedPL)
          .plus(proceeds.minus(costBasisRemoved))
          .toNumber();
      }
    }

    return Array.from(lotsMap.values())
      .map((entry) => {
        const totalQty = entry.lots.reduce((sum, lot) => sum + lot.qty, 0);
        const totalCost = entry.lots.reduce((sum, lot) => sum + lot.cost, 0);
        const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

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
          price: marketPrice,
          value: value,
          pl: unrealizedPL,
          pl_percent: totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0,
          realized_pl: entry.realizedPL,
          calculationMethod: CalculationMethod.FIFO,
          dataSource: apiPrice ? 'Market Data' : 'Last Transaction',
        };
      })
      .filter((h) => h.total_quantity > 0.000001);
  }

  /**
   * Add a transaction to a portfolio
   */
  async addTransaction(
    userId: string,
    portfolioId: string,
    createDto: CreateTransactionDto,
  ): Promise<Transactions> {
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

    await this.cacheService.invalidatePortfolio(userId, portfolioId);

    return data as Transactions;
  }

  /**
   * Get detailed asset performance and history for a specific portfolio
   */
  async getAssetDetails(
    userId: string,
    portfolioId: string,
    symbol: string,
  ): Promise<AssetDetailsResponseDto> {
    await this.findOne(userId, portfolioId);

    const { data: transactionsData, error: txError } = await this.supabase
      .from('transactions')
      .select(
        `
        *,
        assets!inner (
          *
        )
      `,
      )
      .eq('portfolio_id', portfolioId)
      .eq('assets.symbol', symbol)
      .order('transaction_date', { ascending: true });

    if (txError) throw txError;
    if (!transactionsData || transactionsData.length === 0) {
      throw new NotFoundException(
        `No transactions found for asset ${symbol} in this portfolio`,
      );
    }

    const transactions = transactionsData as unknown as TransactionWithAsset[];
    const firstTx = transactions[0];
    if (!firstTx || !firstTx.assets || Array.isArray(firstTx.assets)) {
      throw new InternalServerErrorException(
        'Invalid asset data found in transactions',
      );
    }
    const asset = firstTx.assets;

    const lots: { quantity: number; cost: number; date: string }[] = [];
    let totalQty = 0;
    let realizedPL = 0;

    const txDtos = transactions.map((tx) => ({
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
        const qty = new Decimal(tx.quantity);
        const price = new Decimal(tx.price);
        const fee = new Decimal(tx.fee || 0);
        const exchangeRate = new Decimal(tx.exchange_rate ?? 1);

        const assetTotal = qty.times(price).plus(fee);
        const costBasis = assetTotal.times(exchangeRate);

        lots.push({
          quantity: qty.toNumber(),
          cost: costBasis.toNumber(),
          date: tx.transaction_date,
        });
        totalQty = new Decimal(totalQty).plus(qty).toNumber();
      } else if (tx.type === 'SELL') {
        let qtyToSell = new Decimal(tx.quantity).toNumber();
        let costBasisRemoved = new Decimal(0);

        while (qtyToSell > 0.00000001 && lots.length > 0) {
          const currentLot = lots[0];
          if (!currentLot) break;

          if (currentLot.quantity > qtyToSell) {
            const ratio = qtyToSell / currentLot.quantity;
            const costPortion = new Decimal(currentLot.cost).times(ratio);
            costBasisRemoved = costBasisRemoved.plus(costPortion);

            currentLot.quantity -= qtyToSell;
            currentLot.cost = new Decimal(currentLot.cost)
              .minus(costPortion)
              .toNumber();
            qtyToSell = 0;
          } else {
            costBasisRemoved = costBasisRemoved.plus(currentLot.cost);
            qtyToSell -= currentLot.quantity;
            lots.shift();
          }
        }

        const qty = new Decimal(tx.quantity);
        const price = new Decimal(tx.price);
        const fee = new Decimal(tx.fee || 0);
        const exchangeRate = new Decimal(tx.exchange_rate ?? 1);

        const assetTotal = qty.times(price).minus(fee);
        const proceeds = assetTotal.times(exchangeRate);
        realizedPL = new Decimal(realizedPL)
          .plus(proceeds.minus(costBasisRemoved))
          .toNumber();
        totalQty = new Decimal(totalQty).minus(qty).toNumber();
      }
    }

    if (Math.abs(totalQty) < 0.000001) totalQty = 0;

    const remainingCostBasis = lots.reduce((sum, lot) => sum + lot.cost, 0);
    const avgCost = totalQty > 0 ? remainingCostBasis / totalQty : 0;
    const lastTx = transactions[transactions.length - 1];

    // Explicit check for lastTx
    if (!lastTx) {
      throw new InternalServerErrorException(
        'No transactions found after filtering',
      );
    }

    const apiPrice = await this.marketDataService.getCurrentPrice(
      asset.symbol,
      asset.market ?? undefined,
      asset.asset_class,
    );
    const currentPrice = apiPrice ?? lastTx.price;
    const currentValue = totalQty * currentPrice;
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
        asset_gain: unrealizedPL,
        fx_gain: 0,
        calculation_method: CalculationMethod.FIFO,
        last_updated: new Date().toISOString(),
      },
      transactions: txDtos,
    };
  }
}
