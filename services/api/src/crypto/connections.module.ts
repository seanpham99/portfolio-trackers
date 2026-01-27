/**
 * Connections Module
 * Story: 2.7 Connection Settings
 */

import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { BinanceService } from './binance.service';
import { BinanceSyncService } from './binance-sync.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  imports: [SupabaseModule, PortfoliosModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, BinanceService, BinanceSyncService],
  exports: [ConnectionsService, BinanceService, BinanceSyncService],
})
export class ConnectionsModule {}
