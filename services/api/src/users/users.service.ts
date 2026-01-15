import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@workspace/database-types';
import {
  UserSettingsDto,
  UpdateUserSettingsDto,
  Currency,
} from '@workspace/api-types';

@Injectable()
export class UsersService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async getSettings(userId: string): Promise<UserSettingsDto> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('currency, refresh_interval')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return {
          currency: Currency.USD,
          refresh_interval: 60,
        };
      }
      throw error;
    }

    return {
      currency: data.currency as Currency,
      refresh_interval: data.refresh_interval,
    };
  }

  async updateSettings(
    userId: string,
    updateDto: UpdateUserSettingsDto,
  ): Promise<UserSettingsDto> {
    // First, check if preferences exist
    const { data: existing } = await this.supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create new preferences record with defaults
      const { data, error } = await this.supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          consent_granted: true, // Assume consent is granted if they're accessing settings
          consent_version: '1.0',
          currency: updateDto.currency || Currency.USD,
          refresh_interval: updateDto.refresh_interval || 60,
        })
        .select('currency, refresh_interval')
        .single();

      if (error) throw error;

      return {
        currency: data.currency as Currency,
        refresh_interval: data.refresh_interval,
      };
    }

    // Update existing preferences
    const { data, error } = await this.supabase
      .from('user_preferences')
      .update(updateDto)
      .eq('user_id', userId)
      .select('currency, refresh_interval')
      .single();

    if (error) throw error;

    return {
      currency: data.currency as Currency,
      refresh_interval: data.refresh_interval,
    };
  }
}
