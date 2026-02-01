/**
 * Exchange Sync Service - Holdings Synchronization
 * Story: 5.2 OKX API Sync (Read-Only)
 *
 * Orchestrates syncing exchange holdings to user portfolios:
 * - Fetches balances from Exchange Provider
 * - Upserts crypto assets
 * - Creates SYNC transactions
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  InsertAssets,
  ConnectionStatus,
} from '@workspace/shared-types/database';
import { ExchangeRegistry } from './exchange.registry';
import { ConnectionsService } from './connections.service';
import { ExchangeBalance } from './interfaces/exchange-provider.interface';
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
export class ExchangeSyncService {
  private readonly logger = new Logger(ExchangeSyncService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly registry: ExchangeRegistry,
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

      // Get provider
      const provider = this.registry.get(credentials.exchange);

      // Fetch balances from exchange provider
      const balances = await provider.fetchBalances(
        credentials.apiKey,
        credentials.apiSecret,
        credentials.passphrase,
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
        provider.getName(),
      );

      // Sync each balance
      const syncedBalances: SyncResult['syncedBalances'] = [];

      for (const balance of balances) {
        const assetId = await this.upsertCryptoAsset(
          balance.asset,
          provider.getName(),
        );

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
        `Synced ${syncedBalances.length} assets for user ${userId} from ${provider.getName()}`,
      );

      return {
        success: true,
        assetsSync: syncedBalances.length,
        syncedBalances,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Sync failed: ${errorMessage}`);

      // If credential decryption failed, mark connection as error to stop retries
      if (
        errorMessage.includes('Failed to decrypt') ||
        errorMessage.includes('Unsupported state') ||
        errorMessage.includes('unable to authenticate data')
      ) {
        this.logger.warn(
          `Marking connection ${connectionId} as 'invalid' due to decryption failure`,
        );
        await this.connectionsService
          .updateStatus(userId, connectionId, ConnectionStatus.invalid)
          .catch((e) =>
            this.logger.error(
              `Failed to update connection status: ${e.message}`,
            ),
          );
      }

      return {
        success: false,
        assetsSync: 0,
        syncedBalances: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Get existing portfolio or create "Exchange Sync" portfolio
   */
  private async getOrCreateSyncPortfolio(
    userId: string,
    providedPortfolioId?: string,
    exchangeName?: string,
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

    // Default portfolio name
    const portfolioName = exchangeName
      ? `${exchangeName.charAt(0).toUpperCase() + exchangeName.slice(1)} Sync`
      : 'Exchange Sync';

    // Look for existing Sync portfolio
    const { data: existingPortfolio } = await this.supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .eq('name', portfolioName)
      .single();

    if (existingPortfolio) {
      return existingPortfolio.id;
    }

    // Create new Sync portfolio
    const { data: newPortfolio, error } = await this.supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: portfolioName,
        base_currency: 'USD',
        description: `Auto-synced holdings from ${exchangeName || 'exchange'}`,
      })
      .select('id')
      .single();

    if (error || !newPortfolio) {
      throw new Error(`Failed to create ${portfolioName} portfolio`);
    }

    this.logger.log(`Created "${portfolioName}" portfolio for user ${userId}`);
    return newPortfolio.id;
  }

  /**
   * Upsert crypto asset, creating if not exists
   */
  private async upsertCryptoAsset(
    symbol: string,
    source: string,
  ): Promise<string> {
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
      source: source,
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
    balance: ExchangeBalance,
  ): Promise<void> {
    // Calculate price from USD value and quantity
    const total = new Decimal(balance.total);
    const usdValue = new Decimal(balance.usdValue);
    const price = total.isZero() ? new Decimal(0) : usdValue.div(total);

    // CRITICAL: Use numeric strings to preserve financial precision
    // Never use parseFloat() for currency/quantity values
    const { error } = await this.supabase.from('transactions').insert({
      portfolio_id: portfolioId,
      asset_id: assetId,
      type: 'sync',
      quantity: total.toNumber(), // Decimal.toNumber() is safe for DB inserts
      price: price.toNumber(), // Decimal.toNumber() is safe for DB inserts
      transaction_date: new Date().toISOString(),
      notes: `Sync: ${balance.asset} balance`,
    });

    if (error) {
      this.logger.error(
        `Failed to create sync transaction for ${balance.asset}: ${error.message}`,
      );
      throw error;
    }
  }
}
