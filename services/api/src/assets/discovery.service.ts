import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { CacheService } from '../common/cache/index';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  PendingAssets,
  InsertPendingAssets,
} from '@workspace/shared-types/database';
import { DiscoveredAssetDto } from './dto/discovery.dto';
import { DiscoverableAssetClass } from '@workspace/shared-types/database';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
}

interface CoinGeckoSearchCoin {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
  large?: string;
}

interface CoinGeckoSearchResponse {
  coins: CoinGeckoSearchCoin[];
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly CACHE_TTL = 60; // 60 seconds for external search results
  private readonly yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
  });

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Search external providers for assets not in our registry
   * Uses Promise.allSettled for graceful partial failures
   */
  async searchExternal(
    query: string,
    assetClass: DiscoverableAssetClass,
  ): Promise<DiscoveredAssetDto[]> {
    const cacheKey = `discover:${assetClass}:${query.toLowerCase()}`;
    const cached = await this.cacheService.get<DiscoveredAssetDto[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for discovery: ${cacheKey}`);
      return cached;
    }

    let results: DiscoveredAssetDto[] = [];

    try {
      if (assetClass === DiscoverableAssetClass.CRYPTO) {
        results = await this.searchCoinGecko(query);
      } else {
        // All stock types use Yahoo Finance
        results = await this.searchYahooFinance(query, assetClass);
      }

      // Cache results
      if (results.length > 0) {
        await this.cacheService.set(cacheKey, results, this.CACHE_TTL);
      }

      return results;
    } catch (error) {
      this.logger.error(
        `External search failed for ${query} (${assetClass}): ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Search Yahoo Finance for stocks (VN, US, or Global)
   */
  private async searchYahooFinance(
    query: string,
    assetClass: DiscoverableAssetClass,
  ): Promise<DiscoveredAssetDto[]> {
    try {
      // Prepare query with market suffix if needed
      let searchQuery = query.toUpperCase();
      if (
        assetClass === DiscoverableAssetClass.VN_STOCK &&
        !searchQuery.endsWith('.VN')
      ) {
        searchQuery = `${searchQuery}.VN`;
      }

      const searchResult = await this.yahooFinance.search(searchQuery, {
        newsCount: 0,
        quotesCount: 10,
      });

      const quotes = (searchResult.quotes || []) as YahooSearchQuote[];

      return quotes
        .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .map((q) => this.mapYahooToDiscoveredAsset(q, assetClass));
    } catch (error) {
      this.logger.warn(
        `Yahoo Finance search failed for ${query}: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Search CoinGecko for crypto assets
   */
  /**
   * Search CoinGecko for crypto assets with rate limiting and backoff
   */
  private async searchCoinGecko(query: string): Promise<DiscoveredAssetDto[]> {
    try {
      const url = `${COINGECKO_API_URL}/search?query=${encodeURIComponent(query)}`;
      const response = await this.fetchWithBackoff(url);

      if (!response.ok) {
        this.logger.warn(`CoinGecko search failed: ${response.statusText}`);
        return [];
      }

      const data = (await response.json()) as CoinGeckoSearchResponse;
      const coins = data.coins || [];

      return coins.slice(0, 10).map((coin) => ({
        symbol: coin.symbol.toUpperCase(),
        name_en: coin.name,
        name_local: null,
        asset_class: 'CRYPTO',
        market: 'CRYPTO',
        exchange: null,
        currency: 'USD',
        logo_url: coin.large || coin.thumb || null,
        source: 'coingecko',
      }));
    } catch (error) {
      this.logger.warn(
        `CoinGecko search failed for ${query}: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Fetch wrapper with exponential backoff for 429 Too Many Requests
   */
  private async fetchWithBackoff(
    url: string,
    retries = 3,
    delay = 1000,
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        // If success or non-retryable error, return
        if (response.status !== 429) {
          return response;
        }

        // It is a 429, wait and retry
        this.logger.warn(
          `Rate limited by provider. Retrying in ${delay}ms... (${i + 1}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } catch (err) {
        // Network errors might be worth retrying too, but for now we focus on rate limits
        if (i === retries - 1) throw err;
      }
    }

    throw new Error('Max retries exceeded for external API');
  }

  /**
   * Map Yahoo Finance search result to DiscoveredAssetDto
   */
  private mapYahooToDiscoveredAsset(
    quote: YahooSearchQuote,
    _assetClass: DiscoverableAssetClass,
  ): DiscoveredAssetDto {
    // Determine market from symbol suffix or asset class
    let market = 'US';
    let currency = 'USD';

    if (quote.symbol.endsWith('.VN')) {
      market = 'VN';
      currency = 'VND';
    } else if (quote.symbol.includes('.')) {
      // Other international markets
      const suffix = quote.symbol.split('.').pop() || '';
      market = suffix;
      // Currency mapping for common markets
      const currencyMap: Record<string, string> = {
        L: 'GBP',
        PA: 'EUR',
        DE: 'EUR',
        TO: 'CAD',
        AX: 'AUD',
        HK: 'HKD',
        T: 'JPY',
        SS: 'CNY',
        SZ: 'CNY',
      };
      currency = currencyMap[suffix] || 'USD';
    }

    return {
      symbol: quote.symbol,
      name_en: quote.longname || quote.shortname || quote.symbol,
      name_local: null,
      asset_class: 'EQUITY',
      market,
      exchange: quote.exchDisp || quote.exchange || null,
      currency,
      logo_url: null, // Yahoo doesn't provide logos in search
      source: 'yahoo_finance',
    };
  }

  /**
   * Submit an asset request to the pending_assets queue
   */
  async submitAssetRequest(
    symbol: string,
    assetClass: string,
    userId: string,
  ): Promise<PendingAssets> {
    const insertData: InsertPendingAssets = {
      symbol: symbol.toUpperCase(),
      asset_class: assetClass,
      requested_by: userId,
      status: 'pending',
    };

    const { data, error } = await this.supabase
      .from('pending_assets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Handle duplicate request error
      if (error.code === '23505') {
        throw new ConflictException(
          `You have already requested tracking for ${symbol}. Please wait for admin review.`,
        );
      }
      throw error;
    }

    return data as PendingAssets;
  }

  /**
   * Check if user has already requested this asset
   */
  async hasExistingRequest(
    symbol: string,
    assetClass: string,
    userId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pending_assets')
      .select('id')
      .eq('symbol', symbol.toUpperCase())
      .eq('asset_class', assetClass)
      .eq('requested_by', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error checking existing request: ${error.message}`);
      return false;
    }

    return data !== null;
  }
}
