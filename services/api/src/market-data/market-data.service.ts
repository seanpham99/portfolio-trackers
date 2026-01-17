import { Injectable, Logger } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { CacheService } from '../common/cache';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
  });

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Get current price for an asset
   * @param symbol Ticker symbol (e.g. AAPL, BTC, VIC)
   * @param market Market code (e.g. US, VN, CRYPTO)
   */
  async getCurrentPrice(
    symbol: string,
    market?: string,
    assetClass?: string,
  ): Promise<number | null> {
    const yfSymbol = this.mapToProviderSymbol(symbol, market, assetClass);
    const cacheKey = `price:${yfSymbol}`;

    // Check cache
    const cachedPrice = await this.cacheService.get<number>(cacheKey);
    if (cachedPrice !== null && cachedPrice !== undefined) {
      return cachedPrice;
    }

    try {
      // Fetch from API
      const quote = await this.yahooFinance.quote(yfSymbol);
      const price = (quote as any).regularMarketPrice;

      if (price) {
        await this.cacheService.set(cacheKey, price, this.CACHE_TTL);
        return price;
      }
      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch price for ${symbol} (${yfSymbol}): ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Map internal symbol to Yahoo Finance symbol
   */
  private mapToProviderSymbol(
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
    if (m === 'CRYPTO' || ac === 'CRYPTO') {
      return s.endsWith('-USD') ? s : `${s}-USD`;
    }
    // US and others usually match
    return s;
  }
}
