import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { BinanceService } from './binance.service';
import {
  Database,
  UserConnections,
  ExchangeId,
  ConnectionStatus,
} from '@workspace/shared-types/database';
import {
  ConnectionDto,
  ValidationResultDto,
} from '@workspace/shared-types/api';
import { maskApiKey, encryptSecret, decryptSecret } from './crypto.utils';

@Injectable()
export class ConnectionsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly binanceService: BinanceService,
  ) {}

  /**
   * Find all exchange connections for a user
   */
  async findAll(userId: string): Promise<ConnectionDto[]> {
    const { data, error } = await this.supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, userId);
    }

    return (data || []).map((conn) => this.toDto(conn));
  }

  /**
   * Create a new connection
   */
  async create(
    userId: string,
    exchange: string,
    apiKey: string,
    apiSecret: string,
  ): Promise<ConnectionDto> {
    const { data: connection, error } = await this.supabase
      .from('user_connections')
      .insert({
        user_id: userId,
        exchange_id: exchange as ExchangeId,
        api_key: apiKey,
        api_secret_encrypted: encryptSecret(apiSecret),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, exchange);
    }

    return this.toDto(connection as UserConnections);
  }

  /**
   * Validate exchange credentials using real exchange API
   */
  async validateConnection(
    exchange: string,
    apiKey: string,
    apiSecret: string,
  ): Promise<ValidationResultDto> {
    // Currently only Binance is supported
    if (exchange !== 'binance') {
      return {
        valid: false,
        error: `Exchange ${exchange} is not supported yet`,
      };
    }

    // Use real CCXT validation
    const result = await this.binanceService.validateKeys(apiKey, apiSecret);
    return result;
  }

  /**
   * Delete a connection
   */
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_connections')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      this.handleError(error, id);
    }
  }

  /**
   * Get decrypted connection credentials for sync operations
   * @param userId - User ID for authorization
   * @param connectionId - Connection UUID
   * @returns Object with apiKey and decrypted apiSecret
   */
  async getDecryptedCredentials(
    userId: string,
    connectionId: string,
  ): Promise<{ apiKey: string; apiSecret: string; exchange: ExchangeId }> {
    const { data: conn, error } = await this.supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('id', connectionId)
      .single();

    if (error || !conn) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    if (!conn.api_key || !conn.api_secret_encrypted) {
      throw new Error('Connection credentials are incomplete');
    }

    return {
      apiKey: conn.api_key,
      apiSecret: decryptSecret(conn.api_secret_encrypted),
      exchange: conn.exchange_id as ExchangeId,
    };
  }

  /**
   * Sync a connection
   */
  async sync(userId: string, id: string): Promise<string> {
    // Check if connection exists and belongs to user
    const { data: conn, error } = await this.supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error || !conn) {
      throw new NotFoundException(`Connection ${id} not found`);
    }

    // Update last_synced_at
    const { error: updateError } = await this.supabase
      .from('user_connections')
      .update({
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      this.handleError(updateError, id);
    }

    // In a real app, this would trigger a background job to fetch exchange data
    const message = `Successfully triggered sync for ${conn.exchange_id}`;
    return message;
  }

  /**
   * Convert database row to DTO (never includes secret)
   */
  private toDto(conn: UserConnections): ConnectionDto {
    return {
      id: conn.id,
      exchange: (conn.exchange_id || 'binance') as any, // Using any for enum compatibility with DTO if needed
      apiKeyMasked: maskApiKey(conn.api_key || ''),
      status: (conn.status || 'active') as any,
      lastSyncedAt: conn.last_synced_at || undefined,
      createdAt: conn.created_at || new Date().toISOString(),
    };
  }

  /**
   * Handle Supabase errors
   */
  private handleError(error: PostgrestError, resource: string): never {
    if (error.code === 'PGRST116') {
      throw new NotFoundException(`Connection ${resource} not found`);
    }
    throw error;
  }
}
