import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Assets } from '@workspace/shared-types/database';
import { PopularAssetDto } from '@workspace/shared-types/api';

@Injectable()
export class AssetsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  /**
   * Search for assets by symbol or name
   */
  async search(query: string) {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .or(
        `symbol.ilike.%${query}%,name_en.ilike.%${query}%,name_local.ilike.%${query}%`,
      )
      .limit(10);

    if (error) {
      throw error;
    }

    return (data as Assets[]) ?? [];
  }

  /**
   * Get an asset by symbol
   */
  async findBySymbol(symbol: string): Promise<Assets | null> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Assets;
  }

  /**
   * Get popular assets
   */
  async getPopular(): Promise<PopularAssetDto[]> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .limit(5);

    if (error) {
      throw error;
    }

    const assets = (data as Assets[]) ?? [];

    return assets.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name_en: asset.name_en,
      asset_class: asset.asset_class,
      logo_url: asset.logo_url ?? undefined,
      market: asset.market ?? undefined,
    }));
  }
}
