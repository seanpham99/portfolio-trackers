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
  private encryptionKey: string | null = null;

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    private readonly registry: ExchangeRegistry,
  ) {}

  /**
   * Fetches the master encryption key from Supabase Vault, caching it in memory.
   * @returns The master encryption key.
   */
  private async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    const { data, error } = await this.supabase.rpc('fetch_secret_by_name', {
      p_secret_name: 'ENCRYPTION_KEY',
    });

    if (error) {
      console.warn(
        'Could not fetch encryption key from Vault, falling back to .env. Error:',
        error.message,
      );
      return ''; // Fallback will be handled by crypto.utils
    }

    if (!data) {
      console.warn('ENCRYPTION_KEY not found in Vault, falling back to .env.');
      return ''; // Fallback will be handled by crypto.utils
    }

    this.encryptionKey = data;
    return this.encryptionKey;
  }

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
   * Create a new connection, encrypting secrets with the master key.
   */
  async create(
    userId: string,
    exchange: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string,
  ): Promise<ConnectionDto> {
    const key = await this.getEncryptionKey();

    const { data: connection, error } = await this.supabase
      .from('user_connections')
      .insert({
        user_id: userId,
        exchange_id: exchange as ExchangeId,
        api_key: apiKey,
        api_secret_encrypted: encryptSecret(apiSecret, key),
        passphrase_encrypted: passphrase
          ? encryptSecret(passphrase, key)
          : null,
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
   * Update connection status
   */
  async updateStatus(
    userId: string,
    id: string,
    status: ConnectionStatus,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_connections')
      .update({ status })
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      throw error;
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
      throw new Error(
        'Connection credentials are incomplete (missing api_key or secret)',
      );
    }

    try {
      const key = await this.getEncryptionKey();
      const apiSecret = decryptSecret(conn.api_secret_encrypted, key);
      const passphrase = conn.passphrase_encrypted
        ? decryptSecret(conn.passphrase_encrypted, key)
        : undefined;

      return {
        apiKey: conn.api_key,
        apiSecret,
        exchange: conn.exchange_id as ExchangeId,
        passphrase,
      };
    } catch (error) {
      throw new Error(
        `Failed to decrypt credentials for connection ${connectionId}: ${
          (error as Error).message
        }`,
      );
    }
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
