import { Module } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { AuthGuard } from './guards';

import { MarketDataModule } from '../market-data';

/**
 * Module for portfolio management feature
 */
@Module({
  imports: [MarketDataModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService, AuthGuard],
  exports: [PortfoliosService, AuthGuard],
})
export class PortfoliosModule {}
