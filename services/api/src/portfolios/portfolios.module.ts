import { Module } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { AuthGuard } from './guards';

/**
 * Module for portfolio management feature
 */
@Module({
  controllers: [PortfoliosController],
  providers: [PortfoliosService, AuthGuard],
  exports: [PortfoliosService, AuthGuard],
})
export class PortfoliosModule {}
