/**
 * Connections Module
 * Story: 2.7 Connection Settings
 */

import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { BinanceService } from './binance.service';
import { OkxService } from './okx.service';
import { ExchangeSyncService } from './exchange-sync.service';
import { SyncSchedulerService } from './sync-scheduler.service';
import { ExchangeRegistry } from './exchange.registry';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  imports: [SupabaseModule, PortfoliosModule],
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    BinanceService,
    OkxService,
    ExchangeSyncService,
    SyncSchedulerService,
    ExchangeRegistry,
  ],
  exports: [
    ConnectionsService,
    BinanceService,
    OkxService,
    ExchangeSyncService,
    ExchangeRegistry,
  ],
})
export class ConnectionsModule {}
