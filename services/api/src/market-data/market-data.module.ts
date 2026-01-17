import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { CacheModule } from '../common/cache';

@Module({
  imports: [CacheModule],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
