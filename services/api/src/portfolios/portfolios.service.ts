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
  HoldingDto,
  CalculationMethod,
  PortfolioSummaryDto,
  CreateTransactionDto,
  AssetDetailsResponseDto,
} from '@workspace/shared-types';
import { Decimal } from 'decimal.js';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../common/cache';
import { MarketDataService, QuoteWithMetadata } from '../market-data';

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
  async findAll(
    userId: string,
    refresh = false,
  ): Promise<{ data: PortfolioSummaryDto[]; meta: { staleness: string } }> {
    // Check cache first (unless refresh requested)
    const cacheKey = `portfolios:${userId}`;
    if (!refresh) {
      const cached = await this.cacheService.get<{
        data: PortfolioSummaryDto[];
        meta: { staleness: string };
      }>(cacheKey);
      if (cached) {
        return cached;
      }
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
      const result = {
        data: [],
        meta: { staleness: new Date().toISOString() },
      };
      await this.cacheService.set(cacheKey, result);
      return result;
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

        // Fetch prices with metadata for assets in this portfolio
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

        // Resolve quotes with metadata for 24h change calculation
        const quoteMap = new Map<string, QuoteWithMetadata>();
        const priceMap = new Map<string, number>();
        let hasStaleData = false;
        let latestUpdate = '';
        let worstStatus: 'live' | 'cached' | 'fallback' = 'live';

        await Promise.all(
          Array.from(uniqueAssets.values()).map(async (asset) => {
            const quote = await this.marketDataService.getQuoteWithMetadata(
              asset.symbol,
              asset.market || undefined,
              asset.assetClass,
            );
            if (quote) {
              quoteMap.set(asset.symbol, quote);
              priceMap.set(asset.symbol, quote.price);
              // Track overall staleness
              if (quote.isStale) hasStaleData = true;
              if (!latestUpdate || quote.lastUpdated > latestUpdate) {
                latestUpdate = quote.lastUpdated;
              }
              // Track worst provider status
              if (quote.providerStatus === 'fallback') {
                worstStatus = 'fallback';
              } else if (
                quote.providerStatus === 'cached' &&
                worstStatus !== 'fallback'
              ) {
                worstStatus = 'cached';
              }
            }
          }),
        );

        // Calculate holdings with prices
        const holdings = this.calculateHoldings(portfolioTxs, priceMap);

        // Calculate Net Worth using decimal.js (Sum of Market Values)
        const netWorthDecimal = holdings.reduce(
          (sum, h) => sum.plus(h.value || 0),
          new Decimal(0),
        );
        const netWorth = netWorthDecimal.toNumber();

        // Calculate Total Gain (Unrealized + Realized)
        const totalUnrealizedPL = holdings
          .reduce((sum, h) => sum.plus(h.pl || 0), new Decimal(0))
          .toNumber();
        const totalRealizedPL = holdings
          .reduce((sum, h) => sum.plus(h.realized_pl || 0), new Decimal(0))
          .toNumber();

        // Total Cost Basis
        const totalCostBasis = holdings
          .reduce(
            (sum, h) =>
              sum.plus(new Decimal(h.total_quantity).times(h.avg_cost)),
            new Decimal(0),
          )
          .toNumber();

        // Calculate 24h change from quote metadata
        // Portfolio change = Sum(Holdings[i].value * Holdings[i].changePercent)
        let change24h = new Decimal(0);
        for (const h of holdings) {
          const quote = quoteMap.get(h.symbol);
          if (quote && h.value) {
            // Value change = currentValue * (changePercent / 100)
            const assetChange = new Decimal(h.value)
              .times(quote.regularMarketChangePercent)
              .dividedBy(100);
            change24h = change24h.plus(assetChange);
          }
        }
        const change24hVal = change24h.toNumber();
        const change24hPct =
          netWorth > 0
            ? new Decimal(change24hVal)
                .dividedBy(netWorth)
                .times(100)
                .toNumber()
            : 0;

        // Calculate allocation breakdown by asset class
        const allocationMap = new Map<string, number>();
        for (const h of holdings) {
          const assetClass = h.asset_class || 'Other';
          const currentValue = allocationMap.get(assetClass) || 0;
          allocationMap.set(assetClass, currentValue + (h.value || 0));
        }
        const allocation = Array.from(allocationMap.entries()).map(
          ([label, value]) => ({
            label,
            value,
            color: this.getAssetClassColor(label),
          }),
        );

        return {
          ...portfolio,
          netWorth,
          totalGain: totalUnrealizedPL + totalRealizedPL,
          unrealizedPL: totalUnrealizedPL,
          realizedPL: totalRealizedPL,
          totalCostBasis,
          change24h: change24hVal,
          change24hPercent: change24hPct,
          allocation,
          // NFR3: Staleness indicators
          isStale: hasStaleData,
          lastUpdated: latestUpdate || new Date().toISOString(),
          providerStatus: worstStatus,
          provider:
            quoteMap.size > 0
              ? Array.from(quoteMap.values())[0]?.provider
              : undefined, // Simplification: take first provider as rep
        };
      }),
    );

    const staleness =
      portfoliosWithSummary.length > 0
        ? portfoliosWithSummary
            .map((p) => p.lastUpdated)
            .filter(Boolean)
            .sort()[0] || new Date().toISOString()
        : new Date().toISOString();

    const result = {
      data: portfoliosWithSummary,
      meta: { staleness },
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  /**
   * Find a specific portfolio by id
   */
  async findOne(
    userId: string,
    id: string,
    refresh = false,
  ): Promise<{ data: PortfolioSummaryDto; meta: { staleness: string } }> {
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

    // Fetch quotes with metadata for 24h change calculation
    const uniqueAssets = new Map<
      string,
      { symbol: string; market: string | null; assetClass: string }
    >();
    portfolioTxs.forEach((tx) => {
      if (tx.assets && !Array.isArray(tx.assets)) {
        uniqueAssets.set(tx.assets.symbol, {
          symbol: tx.assets.symbol,
          market: tx.assets.market,
          assetClass: tx.assets.asset_class,
        });
      }
    });

    const quoteMap = new Map<string, QuoteWithMetadata>();
    const priceMap = new Map<string, number>();
    let hasStaleData = false;
    let latestUpdate = '';
    let worstStatus: 'live' | 'cached' | 'fallback' = 'live';

    await Promise.all(
      Array.from(uniqueAssets.values()).map(async (asset) => {
        const quote = await this.marketDataService.getQuoteWithMetadata(
          asset.symbol,
          asset.market || undefined,
          asset.assetClass,
        );
        if (quote) {
          quoteMap.set(asset.symbol, quote);
          priceMap.set(asset.symbol, quote.price);
          if (quote.isStale) hasStaleData = true;
          if (!latestUpdate || quote.lastUpdated > latestUpdate) {
            latestUpdate = quote.lastUpdated;
          }
          if (quote.providerStatus === 'fallback') {
            worstStatus = 'fallback';
          } else if (
            quote.providerStatus === 'cached' &&
            worstStatus !== 'fallback'
          ) {
            worstStatus = 'cached';
          }
        }
      }),
    );

    const holdings = this.calculateHoldings(portfolioTxs, priceMap);

    // Calculate Metrics using decimal.js
    const netWorth = holdings
      .reduce((sum, h) => sum.plus(h.value || 0), new Decimal(0))
      .toNumber();
    const totalUnrealizedPL = holdings
      .reduce((sum, h) => sum.plus(h.pl || 0), new Decimal(0))
      .toNumber();
    const totalRealizedPL = holdings
      .reduce((sum, h) => sum.plus(h.realized_pl || 0), new Decimal(0))
      .toNumber();
    const totalCostBasis = holdings
      .reduce(
        (sum, h) => sum.plus(new Decimal(h.total_quantity).times(h.avg_cost)),
        new Decimal(0),
      )
      .toNumber();

    // Calculate 24h change from quote metadata
    let change24h = new Decimal(0);
    for (const h of holdings) {
      const quote = quoteMap.get(h.symbol);
      if (quote && h.value) {
        const assetChange = new Decimal(h.value)
          .times(quote.regularMarketChangePercent)
          .dividedBy(100);
        change24h = change24h.plus(assetChange);
      }
    }
    const change24hVal = change24h.toNumber();
    const change24hPct =
      netWorth > 0
        ? new Decimal(change24hVal).dividedBy(netWorth).times(100).toNumber()
        : 0;

    // Calculate allocation breakdown by asset class
    const allocationMap = new Map<string, number>();
    for (const h of holdings) {
      const assetClass = h.asset_class || 'Other';
      const currentValue = allocationMap.get(assetClass) || 0;
      allocationMap.set(assetClass, currentValue + (h.value || 0));
    }
    const allocation = Array.from(allocationMap.entries()).map(
      ([label, value]) => ({
        label,
        value,
        color: this.getAssetClassColor(label),
      }),
    );

    const result = {
      data: {
        ...portfolio,
        netWorth,
        totalGain: totalUnrealizedPL + totalRealizedPL,
        unrealizedPL: totalUnrealizedPL,
        realizedPL: totalRealizedPL,
        totalCostBasis,
        change24h: change24hVal,
        change24hPercent: change24hPct,
        allocation,
        // NFR3: Staleness indicators (kept in DTO for backward compat if needed, but primary is meta)
        isStale: hasStaleData,
        lastUpdated: latestUpdate || new Date().toISOString(),
        providerStatus: worstStatus,
        provider:
          quoteMap.size > 0
            ? Array.from(quoteMap.values())[0]?.provider
            : undefined,
      },
      meta: { staleness: latestUpdate || new Date().toISOString() },
    };

    return result;
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
   * Get color for asset class in allocation chart
   * Colors are designed for good visual distinction and accessibility
   */
  private getAssetClassColor(assetClass: string): string {
    const colorMap: Record<string, string> = {
      EQUITY: '#3B82F6', // Blue
      CRYPTO: '#F59E0B', // Amber
      BOND: '#10B981', // Emerald
      CASH: '#6B7280', // Gray
      COMMODITY: '#8B5CF6', // Violet
      REAL_ESTATE: '#F97316', // Orange
      ETF: '#06B6D4', // Cyan
      MUTUAL_FUND: '#EC4899', // Pink
      Other: '#9CA3AF', // Light gray
    };
    return colorMap[assetClass] ?? '#9CA3AF';
  }

  /**
   * Get aggregated holdings for user (all portfolios or specific one)
   */
  async getHoldings(
    userId: string,
    portfolioId?: string,
    refresh = false,
  ): Promise<{ data: HoldingDto[]; meta: { staleness: string } }> {
    // Check cache first (unless refresh requested)
    const cacheKey = portfolioId
      ? `holdings:${userId}:${portfolioId}`
      : `holdings:${userId}`;

    if (!refresh) {
      const cached = await this.cacheService.get<{
        data: HoldingDto[];
        meta: { staleness: string };
      }>(cacheKey);
      if (cached) {
        return cached;
      }
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
    const metaMap = new Map<string, any>(); // To store metadata for holdings
    const timestamps: string[] = [];

    await Promise.all(
      Array.from(uniqueAssets).map(async (symbol) => {
        const txWithAsset = transactions.find(
          (t) => t.assets?.symbol === symbol,
        );
        const asset = txWithAsset?.assets;

        if (asset) {
          const quote = await this.marketDataService.getQuoteWithMetadata(
            symbol,
            asset.market ?? undefined,
            asset.asset_class,
          );
          if (quote) {
            priceMap.set(symbol, quote.price);
            metaMap.set(symbol + '_meta', quote);
            timestamps.push(quote.lastUpdated);
          }
        }
      }),
    );

    const holdings = this.calculateHoldings(transactions, priceMap, metaMap);
    const staleness =
      (timestamps.length > 0 ? timestamps.sort()[0] : undefined) ||
      new Date().toISOString();

    const result = {
      data: holdings,
      meta: { staleness },
    };

    // Cache result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  /**
   * Helper to aggregates transactions into holdings using FIFO Logic
   */
  private calculateHoldings(
    transactions: TransactionWithAsset[],
    priceMap: Map<string, number> = new Map(),
    metaMap: Map<string, any> = new Map(),
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
          isStale: apiPrice
            ? metaMap.get(entry.asset.symbol + '_meta')?.isStale
            : undefined,
          lastUpdated: apiPrice
            ? metaMap.get(entry.asset.symbol + '_meta')?.lastUpdated
            : undefined,
          providerStatus: apiPrice
            ? metaMap.get(entry.asset.symbol + '_meta')?.providerStatus
            : undefined,
          provider: apiPrice
            ? metaMap.get(entry.asset.symbol + '_meta')?.provider
            : undefined,
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
    refresh = false,
  ): Promise<{ data: AssetDetailsResponseDto; meta: { staleness: string } }> {
    // Verify portfolio exists and belongs to user (lightweight check)
    // Avoids calculating entire portfolio performance (O(N) API calls) just for ownership check
    const { count, error } = await this.supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })
      .eq('id', portfolioId)
      .eq('user_id', userId);

    if (error) throw error;
    if (count === 0 || count === null) {
      throw new NotFoundException(`Portfolio ${portfolioId} not found`);
    }

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

    const quote = await this.marketDataService.getQuoteWithMetadata(
      asset.symbol,
      asset.market ?? undefined,
      asset.asset_class,
    );
    const currentPrice = quote?.price ?? lastTx.price;
    const staleness = quote?.lastUpdated ?? new Date().toISOString();

    const currentValue = totalQty * currentPrice;
    const unrealizedPL = currentValue - remainingCostBasis;

    return {
      data: {
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
          last_updated: staleness,
        },
        transactions: txDtos,
      },
      meta: { staleness },
    };
  }

  /**
   * Count portfolios for a user (for tier validation)
   */
  async countByUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Count total active assets across all portfolios for a user (for tier validation)
   */
  async countAssetsByUser(userId: string): Promise<number> {
    const holdings = await this.getHoldings(userId);
    return holdings.data.length;
  }
}
