import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@workspace/shared-types/database';
import { PopularAssetDto } from '@workspace/shared-types/api';

/**
 * Escape special characters in LIKE patterns to prevent injection
 */
function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  /**
   * Search assets using pg_trgm fuzzy matching
   * Uses similarity search on symbol, name_en, and name_local
   */
  async search(query: string) {
    if (!query || query.length < 1) {
      return [];
    }

    // Sanitize query for LIKE pattern
    const sanitizedQuery = escapeLikePattern(query.trim());

    // Use ilike for basic search - pg_trgm GIN index will optimize this
    // For true fuzzy search, we would use similarity() function, but ilike works well with trigram indexes
    const { data, error } = await this.supabase
      .from('assets')
      .select(
        'id, symbol, name_en, name_local, asset_class, market, logo_url, currency',
      )
      .or(
        `symbol.ilike.%${sanitizedQuery}%,name_en.ilike.%${sanitizedQuery}%,name_local.ilike.%${sanitizedQuery}%`,
      )
      .order('symbol', { ascending: true })
      .limit(20);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  /**
   * Find a single asset by exact symbol match (case-insensitive)
   * @param symbol - The asset symbol to look up
   * @returns The asset or null if not found
   */
  async findBySymbol(symbol: string) {
    if (!symbol) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('assets')
      .select(
        'id, symbol, name_en, name_local, asset_class, market, exchange, logo_url, currency',
      )
      .ilike('symbol', symbol)
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows returned (not found)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  /**
   * Get popular/common assets for quick access
   * Returns top assets across different categories
   */
  async getPopular(): Promise<PopularAssetDto[]> {
    // For MVP, we'll return a curated list of the most common assets
    // In future, this could be dynamic based on user activity or trading volume
    const symbols = [
      'AAPL', // US Tech
      'MSFT', // US Tech
      'GOOGL', // US Tech
      'AMZN', // US Tech
      'NVDA', // US Tech
      'BTC', // Crypto
      'ETH', // Crypto
      'VNM', // VN Index ETF
      'VIC', // VN Stock
      'VHM', // VN Stock
    ];

    const { data, error } = await this.supabase
      .from('assets')
      .select('id, symbol, name_en, asset_class, market, logo_url')
      .in('symbol', symbols)
      .order('symbol', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // Transform null to undefined for DTO compatibility
    return (data || []).map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name_en: asset.name_en,
      asset_class: asset.asset_class,
      logo_url: asset.logo_url ?? undefined,
      market: asset.market ?? undefined,
    }));
  }
}
