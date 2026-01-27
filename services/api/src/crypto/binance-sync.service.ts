/**
 * Binance Sync Service - Holdings Synchronization
 * Story: 5.1 Binance API Sync (Read-Only)
 *
 * Orchestrates syncing Binance holdings to user portfolios:
 * - Fetches balances from Binance
 * - Upserts crypto assets
 * - Creates SYNC transactions
 */

import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, InsertAssets } from '@workspace/shared-types/database';
import { BinanceService, BinanceBalance } from './binance.service';
import { ConnectionsService } from './connections.service';
import Decimal from 'decimal.js';

export interface SyncResult {
  success: boolean;
  assetsSync: number;
  syncedBalances: Array<{
    asset: string;
    quantity: string;
    usdValue: string;
  }>;
  error?: string;
}

@Injectable()
export class BinanceSyncService {
  private readonly logger = new Logger(BinanceSyncService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly binanceService: BinanceService,
    private readonly connectionsService: ConnectionsService,
  ) {}

  /**
   * Sync holdings for a user connection
   * @param userId - User ID
   * @param connectionId - Connection UUID
   * @param portfolioId - Target portfolio ID (optional - will create/find default if not provided)
   */
  async syncHoldings(
    userId: string,
    connectionId: string,
    portfolioId?: string,
  ): Promise<SyncResult> {
    try {
      // Get decrypted credentials
      const credentials = await this.connectionsService.getDecryptedCredentials(
        userId,
        connectionId,
      );

      // Fetch balances from Binance
      const balances = await this.binanceService.fetchBalances(
        credentials.apiKey,
        credentials.apiSecret,
      );

      if (balances.length === 0) {
        this.logger.log(`No non-dust balances found for user ${userId}`);
        return {
          success: true,
          assetsSync: 0,
          syncedBalances: [],
        };
      }

      // Get or create portfolio
      const targetPortfolioId = await this.getOrCreateSyncPortfolio(
        userId,
        portfolioId,
      );

      // Sync each balance
      const syncedBalances: SyncResult['syncedBalances'] = [];

      for (const balance of balances) {
        const assetId = await this.upsertCryptoAsset(balance.asset);

        await this.createSyncTransaction(
          userId,
          targetPortfolioId,
          assetId,
          balance,
        );

        syncedBalances.push({
          asset: balance.asset,
          quantity: balance.total,
          usdValue: balance.usdValue,
        });
      }

      // Update last_synced_at on connection
      await this.supabase
        .from('user_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', connectionId);

      this.logger.log(
        `Synced ${syncedBalances.length} assets for user ${userId}`,
      );

      return {
        success: true,
        assetsSync: syncedBalances.length,
        syncedBalances,
      };
    } catch (error) {
      this.logger.error(`Sync failed: ${(error as Error).message}`);
      return {
        success: false,
        assetsSync: 0,
        syncedBalances: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get existing portfolio or create "Binance Sync" portfolio
   */
  private async getOrCreateSyncPortfolio(
    userId: string,
    providedPortfolioId?: string,
  ): Promise<string> {
    // If portfolio ID provided, verify it exists
    if (providedPortfolioId) {
      const { data: portfolio, error } = await this.supabase
        .from('portfolios')
        .select('id')
        .eq('id', providedPortfolioId)
        .eq('user_id', userId)
        .single();

      if (!error && portfolio) {
        return portfolio.id;
      }
    }

    // Look for existing "Binance Sync" portfolio
    const { data: existingPortfolio } = await this.supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Binance Sync')
      .single();

    if (existingPortfolio) {
      return existingPortfolio.id;
    }

    // Create new "Binance Sync" portfolio
    const { data: newPortfolio, error } = await this.supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Binance Sync',
        base_currency: 'USD',
        description: 'Auto-synced holdings from Binance',
      })
      .select('id')
      .single();

    if (error || !newPortfolio) {
      throw new Error('Failed to create Binance Sync portfolio');
    }

    this.logger.log(`Created "Binance Sync" portfolio for user ${userId}`);
    return newPortfolio.id;
  }

  /**
   * Upsert crypto asset, creating if not exists
   */
  private async upsertCryptoAsset(symbol: string): Promise<string> {
    // Check if asset exists
    const { data: existingAsset } = await this.supabase
      .from('assets')
      .select('id')
      .eq('symbol', symbol)
      .eq('asset_class', 'crypto')
      .single();

    if (existingAsset) {
      return existingAsset.id;
    }

    // Create new asset
    const newAsset: InsertAssets = {
      symbol,
      name_en: symbol, // Use symbol as name initially
      asset_class: 'crypto',
      currency: 'USD',
      source: 'binance',
    };

    const { data: insertedAsset, error } = await this.supabase
      .from('assets')
      .insert(newAsset)
      .select('id')
      .single();

    if (error || !insertedAsset) {
      throw new Error(`Failed to create asset for ${symbol}`);
    }

    this.logger.debug(`Created new crypto asset: ${symbol}`);
    return insertedAsset.id;
  }

  /**
   * Create SYNC transaction representing current balance
   */
  private async createSyncTransaction(
    userId: string,
    portfolioId: string,
    assetId: string,
    balance: BinanceBalance,
  ): Promise<void> {
    // Calculate price from USD value and quantity
    const total = new Decimal(balance.total);
    const usdValue = new Decimal(balance.usdValue);
    const price = total.isZero() ? new Decimal(0) : usdValue.div(total);

    const { error } = await this.supabase.from('transactions').insert({
      portfolio_id: portfolioId,
      asset_id: assetId,
      type: 'sync',
      quantity: parseFloat(balance.total),
      price: parseFloat(price.toFixed(8)),
      transaction_date: new Date().toISOString(),
      notes: `Binance sync: ${balance.asset} balance`,
    });

    if (error) {
      this.logger.error(
        `Failed to create sync transaction for ${balance.asset}: ${error.message}`,
      );
      throw error;
    }
  }
}
