import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@repo/database-types';

/**
 * Global module providing Supabase client
 * Configures Supabase with environment variables
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService): SupabaseClient<Database> => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>(
          'SUPABASE_SERVICE_ROLE_KEY',
        );

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined',
          );
        }

        return createClient<Database>(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
