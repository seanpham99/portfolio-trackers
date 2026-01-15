/**
 * Connections Service
 * Handles CCXT integration for exchange validation and connection management
 * Story: 2.7 Connection Settings
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@workspace/shared-types/database';
import {
  ConnectionDto,
  ConnectionStatus,
  ExchangeId,
} from '@workspace/shared-types/api';
import { encryptSecret, decryptSecret, maskApiKey } from './crypto.utils';
import ccxt, { Exchange } from 'ccxt';

type ExchangeClass = typeof ccxt.binance | typeof ccxt.okx;

@Injectable()
export class ConnectionsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  /**
   * Get all connections for a user (secrets are never returned)
   */
  async findAll(userId: string): Promise<ConnectionDto[]> {
    const { data, error } = await this.supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((conn) => this.toDto(conn));
  }

  /**
   * Create a new connection after validating with CCXT
   */
  async create(
    userId: string,
    exchange: ExchangeId,
    apiKey: string,
    apiSecret: string,
  ): Promise<ConnectionDto> {
    // 1. Validate the connection first
    const validation = await this.validateConnection(
      exchange,
      apiKey,
      apiSecret,
    );
    if (!validation.valid) {
      throw new BadRequestException(
        validation.error || 'Invalid API credentials',
      );
    }

    // 2. Encrypt the secret
    const encryptedSecret = encryptSecret(apiSecret);

    // 3. Insert into database
    const { data, error } = await this.supabase
      .from('user_connections')
      .insert({
        user_id: userId,
        exchange_id: exchange,
        api_key: apiKey,
        api_secret_encrypted: encryptedSecret,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, exchange);
    }

    if (!data) {
      throw new Error('Failed to create connection');
    }

    return this.toDto(data);
  }

  /**
   * Delete a connection
   */
  async remove(userId: string, connectionId: string): Promise<void> {
    // Check if exists
    const { data: existing } = await this.supabase
      .from('user_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('id', connectionId)
      .single();

    if (!existing) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    const { error } = await this.supabase
      .from('user_connections')
      .delete()
      .eq('user_id', userId)
      .eq('id', connectionId);

    if (error) throw error;
  }

  /**
   * Validate exchange credentials using CCXT (dry-run)
   */
  async validateConnection(
    exchange: ExchangeId,
    apiKey: string,
    apiSecret: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const exchangeInstance = this.createExchangeInstance(
        exchange,
        apiKey,
        apiSecret,
      );

      // Attempt to fetch balance - this validates the API keys
      await exchangeInstance.fetchBalance();

      return { valid: true };
    } catch (err: any) {
      // Parse CCXT errors into user-friendly messages
      const errorMessage = this.parseCcxtError(err);
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Get decrypted API secret for a connection (internal use only for syncing)
   */
  async getDecryptedSecret(
    userId: string,
    connectionId: string,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('user_connections')
      .select('api_secret_encrypted')
      .eq('user_id', userId)
      .eq('id', connectionId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    return decryptSecret(data.api_secret_encrypted);
  }

  /**
   * Create CCXT exchange instance
   */
  private createExchangeInstance(
    exchange: ExchangeId,
    apiKey: string,
    apiSecret: string,
  ): Exchange {
    const exchangeClasses: Record<ExchangeId, ExchangeClass> = {
      [ExchangeId.binance]: ccxt.binance,
      [ExchangeId.okx]: ccxt.okx,
    };

    const ExchangeClass = exchangeClasses[exchange];
    if (!ExchangeClass) {
      throw new BadRequestException(`Unsupported exchange: ${exchange}`);
    }

    return new ExchangeClass({
      apiKey,
      secret: apiSecret,
      enableRateLimit: true,
    });
  }

  /**
   * Parse CCXT errors into user-friendly messages
   */
  private parseCcxtError(err: any): string {
    const message = err.message || 'Unknown error';

    // Common CCXT error patterns
    if (
      message.includes('AuthenticationError') ||
      message.includes('Invalid API-key')
    ) {
      return 'Invalid API Key or Secret. Please check your credentials.';
    }
    if (message.includes('PermissionDenied')) {
      return 'API Key does not have required permissions. Enable "Read" access.';
    }
    if (message.includes('RateLimitExceeded')) {
      return 'Rate limit exceeded. Please try again in a few seconds.';
    }
    if (message.includes('IP')) {
      return 'IP address not whitelisted. Add your server IP to allowed list.';
    }
    if (message.includes('Network')) {
      return 'Network error connecting to exchange. Please try again.';
    }

    // Return the original message if no pattern matches
    return message;
  }

  /**
   * Convert database row to DTO (never includes secret)
   */
  private toDto(conn: any): ConnectionDto {
    return {
      id: conn.id,
      exchange: conn.exchange_id as ExchangeId,
      apiKeyMasked: maskApiKey(conn.api_key),
      status: conn.status as ConnectionStatus,
      lastSyncedAt: conn.last_synced_at || undefined,
      createdAt: conn.created_at,
    };
  }

  /**
   * Handle Supabase errors
   */
  private handleError(error: PostgrestError, resource: string): never {
    if (error.code === '23505') {
      throw new ConflictException(`Connection to ${resource} already exists`);
    }
    throw error;
  }
}
