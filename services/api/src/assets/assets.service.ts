import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@repo/database-types';

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
      .select('id, symbol, name_en, name_local, asset_class, market, logo_url, currency')
      .or(`symbol.ilike.%${sanitizedQuery}%,name_en.ilike.%${sanitizedQuery}%,name_local.ilike.%${sanitizedQuery}%`)
      .order('symbol', { ascending: true })
      .limit(20);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
