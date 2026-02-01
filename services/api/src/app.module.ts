import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase';
import { PortfoliosModule } from './portfolios';
import { AssetsModule } from './assets/assets.module';
import { UsersModule } from './users/users.module';
import { CacheModule } from './common/cache';
import { ConnectionsModule } from './crypto';
import { MarketDataModule } from './market-data';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Global limit: 100 req/min
      },
    ]),
    SupabaseModule,
    CacheModule,
    PortfoliosModule,
    AssetsModule,
    UsersModule,
    ConnectionsModule,
    MarketDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
