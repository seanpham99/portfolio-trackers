import { Injectable, Logger, Inject } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { CacheService } from '../common/cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@workspace/shared-types/database';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Quote data with metadata for staleness tracking (NFR3)
 */
export interface QuoteWithMetadata {
  price: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  previousClose: number | null;
  isStale: boolean;
  lastUpdated: string;
  providerStatus: 'live' | 'cached' | 'fallback';
  provider: 'Yahoo' | 'CoinGecko' | 'cached' | 'fallback';
}

/**
 * Helper function for exponential backoff with jitter (NFR8)
 * @param attemptNumber 0-indexed attempt number
 * @param baseDelayMs Base delay in milliseconds (default 1000ms)
 * @param maxDelayMs Maximum delay cap (default 30000ms)
 */
async function exponentialBackoff(
  attemptNumber: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000,
): Promise<void> {
  const exponentialDelay = baseDelayMs * Math.pow(2, attemptNumber);
  const jitter = Math.random() * baseDelayMs;
  const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly CACHE_TTL = 300; // 5 minutes for live prices
  private readonly COIN_ID_TTL = 86400; // 24 hours for symbol->ID mapping
  private readonly HISTORICAL_PRICE_TTL = 86400; // 24h cache for historical prices
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private yf: any;

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly cacheService: CacheService,
  ) {
    // Fix for CommonJS/ESM interop issues with yahoo-finance2
    const PostgresYahooFinance = (YahooFinance as any).default || YahooFinance;
    // The library requires instantiation in this version/env
    this.yf = new PostgresYahooFinance();

    if (this.yf?.suppressNotices) {
      this.yf.suppressNotices(['yahooSurvey']);
    }
  }

  /**
   * Get current price for an asset
   * @param symbol Ticker symbol (e.g. AAPL, BTC, VIC)
   * @param market Market code (e.g. US, VN, CRYPTO)
   * @param assetClass Asset class (e.g. EQUITY, CRYPTO)
   */
  async getCurrentPrice(
    symbol: string,
    market?: string,
    assetClass?: string,
  ): Promise<number | null> {
    const isCrypto =
      (market && market.toUpperCase() === 'CRYPTO') ||
      (assetClass && assetClass.toUpperCase() === 'CRYPTO');

    if (isCrypto) {
      return this.getCryptoPrice(symbol, market, assetClass);
    }

    // Default to Yahoo Finance for non-crypto
    const yfSymbol = this.mapToYahooFinanceSymbol(symbol, market, assetClass);
    return this.getYahooPrice(yfSymbol, symbol);
  }

  /**
   * Fetch crypto price from CoinGecko using ID from database
   * Fallback to Yahoo Finance if CoinGecko fails or ID not found
   */
  private async getCryptoPrice(
    symbol: string,
    market?: string,
    assetClass?: string,
  ): Promise<number | null> {
    // Retry with exponential backoff for CoinGecko
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const coinId = await this.getCoinGeckoId(symbol);

        if (coinId) {
          const cacheKey = `price:coingecko:${coinId}`;
          const cachedPrice = await this.cacheService.get<number>(cacheKey);

          if (cachedPrice !== null && cachedPrice !== undefined) {
            return cachedPrice;
          }

          const url = `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`;
          const response = await fetch(url);

          if (response.ok) {
            const data = await response.json();
            const price = data[coinId]?.usd;

            if (price) {
              await this.cacheService.set(cacheKey, price, this.CACHE_TTL);
              return price;
            }
          } else {
            this.logger.warn(
              `CoinGecko API error for ${symbol}: ${response.statusText}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} failed for CoinGecko ${symbol}: ${(error as Error).message}`,
        );
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await exponentialBackoff(attempt);
        }
      }
    }

    // Fallback to Yahoo Finance
    this.logger.log(`Falling back to Yahoo Finance for ${symbol}`);
    const yfSymbol = this.mapToYahooFinanceSymbol(symbol, market, assetClass);
    return this.getYahooPrice(yfSymbol, symbol);
  }

  /**
   * Resolve CoinGecko ID from Database or Cache
   * Note: COIN_ID_TTL caches the MAPPING (Symbol -> ID), not the price.
   * IDs change very rarely (e.g. BTC -> bitcoin), so 24h is safe.
   */
  private async getCoinGeckoId(symbol: string): Promise<string | null> {
    const cacheKey = `asset:metadata:${symbol.toUpperCase()}`;
    const cachedId = await this.cacheService.get<string>(cacheKey);

    if (cachedId) {
      return cachedId;
    }

    // Lookup in Database
    const { data, error } = await this.supabase
      .from('assets')
      .select('metadata')
      .eq('symbol', symbol.toUpperCase())
      .eq('asset_class', 'CRYPTO')
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Database error looking up asset ${symbol}: ${error.message}`,
      );
      return null;
    }

    if (!data || !data.metadata) {
      this.logger.warn(`No metadata found for crypto asset ${symbol}`);
      return null;
    }

    const metadata = data.metadata as any;
    const coingeckoId = metadata.coingecko_id;

    if (coingeckoId) {
      await this.cacheService.set(cacheKey, coingeckoId, this.COIN_ID_TTL);
      return coingeckoId;
    }

    this.logger.warn(`No coingecko_id in metadata for ${symbol}`);
    return null;
  }

  /**
   * Fetch price from Yahoo Finance with exponential backoff and staleness fallback (NFR8)
   */
  private async getYahooPrice(
    yfSymbol: string,
    originalSymbol: string,
  ): Promise<number | null> {
    const cacheKey = `price:yahoo:${yfSymbol}`;
    const cachedPrice = await this.cacheService.get<number>(cacheKey);

    if (cachedPrice !== null && cachedPrice !== undefined) {
      return cachedPrice;
    }

    // Retry with exponential backoff
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const quote = await this.yf.quote(yfSymbol);
        const price = (quote as any).regularMarketPrice;

        if (price) {
          await this.cacheService.set(cacheKey, price, this.CACHE_TTL);
          return price;
        }
        return null;
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} failed for ${originalSymbol} (${yfSymbol}): ${(error as Error).message}`,
        );
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await exponentialBackoff(attempt);
        }
      }
    }

    // All retries failed - return null (caller handles fallback)
    this.logger.error(
      `All ${this.MAX_RETRY_ATTEMPTS} attempts failed for ${originalSymbol}`,
    );
    return null;
  }

  /**
   * Get quote with full metadata including change values and staleness (NFR3)
   * This method returns price, 24h change, change percent, and staleness indicators.
   * @param symbol Ticker symbol
   * @param market Market code (e.g. US, VN, CRYPTO)
   * @param assetClass Asset class (e.g. EQUITY, CRYPTO)
   */
  async getQuoteWithMetadata(
    symbol: string,
    market?: string,
    assetClass?: string,
  ): Promise<QuoteWithMetadata | null> {
    const yfSymbol = this.mapToYahooFinanceSymbol(symbol, market, assetClass);
    const cacheKey = `quote:metadata:${yfSymbol}`;
    const staleFallbackKey = `quote:fallback:${yfSymbol}`;

    // Check for fresh cached quote
    const cachedQuote =
      await this.cacheService.get<QuoteWithMetadata>(cacheKey);
    if (cachedQuote) {
      return cachedQuote;
    }

    // Retry with exponential backoff
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const quote = await this.yf.quote(yfSymbol);

        if (quote && (quote as any).regularMarketPrice) {
          const result: QuoteWithMetadata = {
            price: (quote as any).regularMarketPrice,
            regularMarketChange: (quote as any).regularMarketChange ?? 0,
            regularMarketChangePercent:
              (quote as any).regularMarketChangePercent ?? 0,
            previousClose: (quote as any).regularMarketPreviousClose ?? null,
            isStale: false,
            lastUpdated: new Date().toISOString(),
            providerStatus: 'live',
            provider: 'Yahoo',
          };

          // Cache the fresh quote for 5 minutes
          await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
          // Also store as fallback with longer TTL (1 hour) for stale scenarios
          await this.cacheService.set(staleFallbackKey, result, 3600);

          return result;
        }
        break; // Quote returned but no price - don't retry
      } catch (error) {
        this.logger.warn(
          `getQuoteWithMetadata attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} failed for ${symbol}: ${(error as Error).message}`,
        );
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await exponentialBackoff(attempt);
        }
      }
    }

    // All retries failed - check for stale fallback in Redis
    const staleQuote =
      await this.cacheService.get<QuoteWithMetadata>(staleFallbackKey);
    if (staleQuote) {
      this.logger.log(
        `Returning stale fallback for ${symbol} (last updated: ${staleQuote.lastUpdated})`,
      );
      return {
        ...staleQuote,
        isStale: true,
        providerStatus: 'fallback',
        provider: 'cached',
      };
    }

    this.logger.error(
      `No data available for ${symbol} - provider unreachable and no fallback cached`,
    );
    return null;
  }

  /**
   * Get historical price for a symbol at a specific date
   * Used for calculating 24h change when current quote doesn't have it
   * @param symbol Ticker symbol
   * @param market Market code
   * @param assetClass Asset class
   * @param date Target date for historical price
   */
  async getHistoricalPrice(
    symbol: string,
    market?: string,
    assetClass?: string,
    date?: Date,
  ): Promise<number | null> {
    const targetDate = date || new Date(Date.now() - 86400000); // Default: 24h ago
    const dateStr = targetDate.toISOString().split('T')[0];
    const yfSymbol = this.mapToYahooFinanceSymbol(symbol, market, assetClass);
    const cacheKey = `price:historical:${yfSymbol}:${dateStr}`;

    // Check cache first (historical prices are immutable)
    const cachedPrice = await this.cacheService.get<number>(cacheKey);
    if (cachedPrice !== null && cachedPrice !== undefined) {
      return cachedPrice;
    }

    // Retry with exponential backoff
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const queryOptions = {
          period1: dateStr,
          period2: new Date(targetDate.getTime() + 86400000)
            .toISOString()
            .split('T')[0],
        };

        const response = await this.yf.chart(yfSymbol, queryOptions as any);
        const quotes = response?.quotes;

        if (quotes && quotes.length > 0 && quotes[0]) {
          const price = quotes[0].close;
          if (price) {
            // Cache with 24h TTL (historical data doesn't change)
            await this.cacheService.set(
              cacheKey,
              price,
              this.HISTORICAL_PRICE_TTL,
            );
            return price;
          }
        }

        this.logger.warn(
          `No historical data found for ${symbol} on ${dateStr}`,
        );
        return null; // Don't retry if data is missing (not an error)
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} failed to fetch historical price for ${symbol}: ${(error as Error).message}`,
        );
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await exponentialBackoff(attempt);
        }
      }
    }

    this.logger.error(
      `All attempts failed to fetch historical price for ${symbol}`,
    );
    return null;
  }

  /**
   * Get historical exchange rate between two currencies
   */
  async getHistoricalExchangeRate(
    from: string,
    to: string,
    date: Date,
  ): Promise<number | null> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (fromCode === toCode) {
      return 1;
    }

    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `fx:rate:${fromCode}:${toCode}:${dateStr}`;

    // 1. Check Cache
    const cachedRate = await this.cacheService.get<number>(cacheKey);
    if (cachedRate !== null && cachedRate !== undefined) {
      return cachedRate;
    }

    // 2. Fetch from Yahoo Finance
    // 2. Fetch from Yahoo Finance with backoff
    const symbol = `${fromCode}${toCode}=X`;

    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        this.logger.log(`Fetching FX rate for ${symbol} on ${dateStr}`);

        // We fetch a range to ensure we get a quote if the exact date is a weekend/holiday
        // Yahoo Historical expects period1 (start) and period2 (end)
        const queryOptions = {
          period1: dateStr,
          period2: new Date(date.getTime() + 86400000)
            .toISOString()
            .split('T')[0], // Next day
        };

        const response = await this.yf.chart(symbol, queryOptions as any);
        const quotes = response?.quotes;

        if (quotes && quotes.length > 0 && quotes[0]) {
          // Use the close price of the first result
          const rate = quotes[0].close;

          if (rate) {
            // Cache with long TTL (7 days) as historical rates don't change
            await this.cacheService.set(cacheKey, rate, 604800);
            return rate;
          }
        }

        this.logger.warn(`No chart data found for ${symbol} on ${dateStr}`);
        return null;
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} failed to fetch FX rate for ${symbol}: ${(error as Error).message}`,
        );
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await exponentialBackoff(attempt);
        }
      }
    }

    this.logger.error(`All attempts failed to fetch FX rate for ${symbol}`);
    return null;
  }

  /**
   * Map internal symbol to Yahoo Finance symbol
   */
  private mapToYahooFinanceSymbol(
    symbol: string,
    market?: string,
    assetClass?: string,
  ): string {
    const s = symbol.toUpperCase();
    const m = (market || '').toUpperCase();
    const ac = (assetClass || '').toUpperCase();

    if (m === 'VN') {
      return s.endsWith('.VN') ? s : `${s}.VN`;
    }
    // Used for fallback
    if (m === 'CRYPTO' || ac === 'CRYPTO') {
      return s.endsWith('-USD') ? s : `${s}-USD`;
    }
    // US and others usually match
    return s;
  }
}
