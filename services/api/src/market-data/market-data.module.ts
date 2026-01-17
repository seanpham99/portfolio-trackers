import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { CacheModule } from '../common/cache';
import { SupabaseModule } from '../common/supabase';

import { MarketDataController } from './market-data.controller';

@Module({
  imports: [CacheModule, SupabaseModule],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
