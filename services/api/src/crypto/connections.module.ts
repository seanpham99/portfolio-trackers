/**
 * Connections Module
 * Story: 2.7 Connection Settings
 */

import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  imports: [SupabaseModule, PortfoliosModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
