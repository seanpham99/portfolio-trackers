import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { ExchangeRegistry } from './exchange.registry';
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
    private readonly registry: ExchangeRegistry,
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
   * Find a specific connection by ID
   */
  async findOne(userId: string, id: string): Promise<ConnectionDto> {
    const { data, error } = await this.supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) {
      this.handleError(error, id);
    }

    return this.toDto(data as UserConnections);
  }

  /**
   * Create a new connection
   */
  async create(
    userId: string,
    exchange: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string,
  ): Promise<ConnectionDto> {
    const { data: connection, error } = await this.supabase
      .from('user_connections')
      .insert({
        user_id: userId,
        exchange_id: exchange as ExchangeId,
        api_key: apiKey,
        api_secret_encrypted: encryptSecret(apiSecret),
        passphrase_encrypted: passphrase ? encryptSecret(passphrase) : null,
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
    passphrase?: string,
  ): Promise<ValidationResultDto> {
    try {
      const provider = this.registry.get(exchange);
      return await provider.validateKeys(apiKey, apiSecret, passphrase);
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
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
   * @returns Object with apiKey, decrypted apiSecret and optional passphrase
   */
  async getDecryptedCredentials(
    userId: string,
    connectionId: string,
  ): Promise<{
    apiKey: string;
    apiSecret: string;
    exchange: ExchangeId;
    passphrase?: string;
  }> {
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

    const credentials: {
      apiKey: string;
      apiSecret: string;
      exchange: ExchangeId;
      passphrase?: string;
    } = {
      apiKey: conn.api_key,
      apiSecret: decryptSecret(conn.api_secret_encrypted),
      exchange: conn.exchange_id as ExchangeId,
    };

    if (conn.passphrase_encrypted) {
      credentials.passphrase = decryptSecret(conn.passphrase_encrypted);
    }

    return credentials;
  }

  /**
   * Find all active connections for background sync (System scope)
   */
  async findAllActive(): Promise<Array<{ id: string; user_id: string }>> {
    const { data, error } = await this.supabase
      .from('user_connections')
      .select('id, user_id')
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Convert database row to DTO (never includes secret)
   */
  private toDto(conn: UserConnections): ConnectionDto {
    return {
      id: conn.id,
      exchange: conn.exchange_id ?? 'binance',
      apiKeyMasked: maskApiKey(conn.api_key || ''),
      status: (conn.status ?? 'active') as ConnectionStatus,
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
