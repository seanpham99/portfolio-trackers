/**
 * Binance Service - CCXT Wrapper for Binance API
 * Story: 5.1 Binance API Sync (Read-Only)
 *
 * Provides validated access to Binance exchange for:
 * - Credential validation
 * - Spot balance fetching with dust filtering
 */

import { Injectable, Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';
import Decimal from 'decimal.js';

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  usdValue: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  permissions?: string[];
}

/**
 * Map CCXT errors to user-friendly messages
 */
function mapCcxtError(error: unknown): string {
  if (error instanceof ccxt.AuthenticationError) {
    return 'Invalid API credentials. Check your key and secret.';
  }
  if (error instanceof ccxt.RateLimitExceeded) {
    return 'Too many requests. Please wait a moment.';
  }
  if (error instanceof ccxt.NetworkError) {
    return 'Unable to connect to Binance. Check your network.';
  }
  if (error instanceof ccxt.ExchangeNotAvailable) {
    return 'Binance is temporarily unavailable.';
  }
  if (error instanceof ccxt.ExchangeError) {
    return `Exchange error: ${(error as Error).message}`;
  }
  return 'An unexpected error occurred while connecting to Binance.';
}

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly DUST_THRESHOLD_USD = new Decimal('1');

  /**
   * Create a configured CCXT Binance instance
   */
  private createExchange(apiKey: string, secret: string): ccxt.binance {
    return new ccxt.binance({
      apiKey,
      secret,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        adjustForTimeDifference: true,
      },
    });
  }

  /**
   * Validate API credentials by attempting to fetch account balance
   * This is a real validation - not a mock
   */
  async validateKeys(
    apiKey: string,
    secret: string,
  ): Promise<ValidationResult> {
    const exchange = this.createExchange(apiKey, secret);

    try {
      // Attempt to fetch balance - requires valid read permissions
      await exchange.fetchBalance();

      this.logger.log('Binance API keys validated successfully');

      return {
        valid: true,
        permissions: ['spot_read'],
      };
    } catch (error) {
      this.logger.warn(
        `Binance API validation failed: ${(error as Error).message}`,
      );

      return {
        valid: false,
        error: mapCcxtError(error),
      };
    }
  }

  /**
   * Fetch spot balances from Binance
   * Filters out dust balances (< $1 USD equivalent)
   */
  async fetchBalances(
    apiKey: string,
    secret: string,
  ): Promise<BinanceBalance[]> {
    const exchange = this.createExchange(apiKey, secret);

    try {
      // Fetch balance from Binance
      const balance = await exchange.fetchBalance();
      const balances: BinanceBalance[] = [];

      // Get USDT ticker prices for USD value estimation
      const tickers = await exchange.fetchTickers();

      // Iterate over all currencies in the balance
      // Cast to allow string indexing - CCXT Balance type is too strict
      const totals = balance.total as unknown as Record<string, number>;
      const frees = balance.free as unknown as Record<string, number>;
      const useds = balance.used as unknown as Record<string, number>;
      const currencies = Object.keys(totals || {});

      for (const asset of currencies) {
        const totalAmount = totals[asset];
        if (totalAmount === undefined) continue;

        const total = new Decimal(totalAmount);

        // Skip zero balances
        if (total.isZero()) continue;

        // Calculate USD equivalent
        let usdValue = new Decimal(0);

        if (
          asset === 'USDT' ||
          asset === 'USD' ||
          asset === 'USDC' ||
          asset === 'BUSD'
        ) {
          usdValue = total;
        } else {
          // Try to find USDT pair
          const symbol = `${asset}/USDT`;
          const ticker = tickers[symbol];
          if (ticker?.last) {
            usdValue = total.mul(new Decimal(ticker.last));
          }
        }

        // Filter dust (< $1 USD)
        if (usdValue.lt(this.DUST_THRESHOLD_USD)) {
          this.logger.debug(
            `Skipping dust asset ${asset}: $${usdValue.toFixed(2)}`,
          );
          continue;
        }

        const freeAmount = new Decimal(frees[asset] ?? 0);
        const lockedAmount = new Decimal(useds[asset] ?? 0);

        balances.push({
          asset,
          free: freeAmount.toString(),
          locked: lockedAmount.toString(),
          total: total.toString(),
          usdValue: usdValue.toFixed(2),
        });
      }

      this.logger.log(
        `Fetched ${balances.length} non-dust balances from Binance`,
      );
      return balances;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Binance balances: ${(error as Error).message}`,
      );
      throw new Error(mapCcxtError(error));
    }
  }
}
