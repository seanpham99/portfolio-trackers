# Story 3-6: Basic Price Pipeline

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P0 (Critical - Wire Mocks)  
**Story Points:** 8  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** Developer  
**I want** to integrate with an external price API to fetch real market data  
**So that** users see live prices instead of mocked data

---

## Context

Stories 3-1 through 3-4 implemented portfolio intelligence features (performance charts, allocation, holdings table enhancements) using mocked price data. This story completes Epic 3 by wiring real price APIs, replacing all `MOCK_PRICES` constants with live market data.

**This is the "wire-up" story** that transforms the mock-based MVP into a production-ready feature.

---

## Acceptance Criteria

### 1. External Price API Integration

**Given** the NestJS API  
**When** the price service is implemented  
**Then** it should integrate with:

**For Cryptocurrency:**

- CoinGecko API (free tier, no API key required)
- Endpoint: `GET /api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`
- Rate limit: 10-50 calls/minute
- Supported: BTC, ETH, major cryptocurrencies

**For US Stocks:**

- Alpha Vantage API (free tier, API key required)
- Endpoint: `GET /query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=XXX`
- Rate limit: 5 calls/minute (free tier)
- Alternative: Twelve Data API (500 calls/day free)

**For Vietnamese Stocks:**

- vnstock Python library (via internal proxy service)
- Self-hosted API endpoint
- No rate limits (self-managed)

### 2. Price Cache Service

**Given** external APIs have rate limits  
**When** the price service fetches prices  
**Then** it should:

- Cache prices in Redis with 5-minute TTL
- Check cache before making external API calls
- Log cache hits/misses for monitoring
- Handle cache failures gracefully (fetch from API if Redis down)

**Redis Cache Structure:**

```
Key: price:{symbol}:{currency}
Value: { price: 45000, source: "coingecko", timestamp: "2025-12-29T10:00:00Z" }
TTL: 300 seconds (5 minutes)
```

### 3. Scheduled Price Updates

**Given** prices need to be refreshed regularly  
**When** the price update job runs  
**Then** it should:

- Run every 5 minutes (configurable via environment variable)
- Fetch prices for all unique symbols in user portfolios
- Batch API calls to respect rate limits (e.g., 100 symbols per batch)
- Log success/failure per symbol
- Alert on failure rate >10%

**Implementation:**

- Use NestJS Scheduler (`@nestjs/schedule`)
- Cron pattern: `*/5 * * * *` (every 5 minutes)

### 4. API Endpoints

**Given** the frontend needs access to prices  
**When** API endpoints are called  
**Then** the following should be available:

```typescript
// Get current prices for multiple symbols
GET /api/prices/current?symbols=BTC,ETH,AAPL
Response:
{
  "BTC": { "price": 45000, "currency": "USD", "updatedAt": "2025-12-29T10:00:00Z" },
  "ETH": { "price": 2500, "currency": "USD", "updatedAt": "2025-12-29T10:00:00Z" },
  "AAPL": { "price": 180.5, "currency": "USD", "updatedAt": "2025-12-29T10:00:00Z" }
}

// Get historical prices for a symbol
GET /api/prices/history/:symbol?days=90
Response:
{
  "symbol": "BTC",
  "currency": "USD",
  "data": [
    { "date": "2025-12-29", "open": 44800, "high": 45200, "low": 44500, "close": 45000 },
    // ... 89 more days
  ]
}
```

### 5. Frontend Integration (Replace Mocks)

**Given** Stories 3-1 through 3-4 use `MOCK_PRICES` constant  
**When** this story is complete  
**Then** the following should be updated:

**Story 3-1 (Performance Dashboard):**

- Replace mock data generation with API call: `GET /api/prices/history/:portfolio`
- Use real historical prices instead of generated data

**Story 3-2 (Asset Allocation):**

- Replace `MOCK_PRICES` lookup with API call: `GET /api/prices/current?symbols=...`
- Fetch prices for all holdings on component mount

**Story 3-3 (Holdings Table):**

- Replace `MOCK_PRICES` lookup with API call: `GET /api/prices/current?symbols=...`
- Use React Query to cache prices on frontend

**Story 3-4 (Asset Detail):**

- Replace mock OHLC generation with API call: `GET /api/prices/history/:symbol?days=90`
- Display real price history instead of generated data

### 6. Stale Data Indicators

**Given** prices may not be fresh  
**When** a price was last updated >5 minutes ago  
**Then** the UI should display:

- Amber "Stale Data" badge next to price
- Tooltip: "Last updated: 12 minutes ago. Refreshing..."
- "Last Updated" timestamp in holdings table footer

### 7. Fallback Handling

**Given** external APIs may fail  
**When** price fetching fails  
**Then** the system should:

- Log error with symbol and API source
- Fall back to last cached price (if available)
- Display "Price Unavailable" if no cache
- Show error banner: "Unable to fetch prices. Using cached data."
- Retry after exponential backoff (30s, 60s, 120s)

### 8. Rate Limit Management

**Given** APIs have rate limits  
**When** rate limit is exceeded  
**Then** the system should:

- Catch 429 (Too Many Requests) errors
- Wait based on `Retry-After` header
- Queue requests for later retry
- Log rate limit events for monitoring

---

## Technical Implementation Notes

### Price Service Architecture

```typescript
// services/price/price.service.ts
@Injectable()
export class PriceService {
  constructor(
    private readonly cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getCurrentPrice(
    symbol: string,
    currency: string = "USD",
  ): Promise<Price> {
    // 1. Check Redis cache
    const cacheKey = `price:${symbol}:${currency}`;
    const cached = await this.cacheManager.get<Price>(cacheKey);
    if (cached) return cached;

    // 2. Determine API source based on asset class
    const source = this.getSourceForSymbol(symbol);

    // 3. Fetch from external API
    const price = await this.fetchFromSource(source, symbol, currency);

    // 4. Cache result
    await this.cacheManager.set(cacheKey, price, { ttl: 300 });

    return price;
  }

  async getHistoricalPrices(symbol: string, days: number): Promise<OHLCData[]> {
    // Similar pattern: cache → API → cache
  }

  @Cron("*/5 * * * *")
  async updateAllPrices() {
    // Fetch all unique symbols from portfolios
    const symbols = await this.portfolioService.getAllUniqueSymbols();

    // Batch process to respect rate limits
    await this.batchUpdatePrices(symbols);
  }
}
```

### API Source Determination

```typescript
private getSourceForSymbol(symbol: string): PriceSource {
  if (CRYPTO_SYMBOLS.includes(symbol)) {
    return 'coingecko';
  }
  if (VIETNAM_SYMBOLS.includes(symbol)) {
    return 'vnstock';
  }
  return 'alphavantage'; // Default for US stocks
}
```

### CoinGecko Integration

```typescript
async fetchFromCoinGecko(symbol: string): Promise<number> {
  const coinId = SYMBOL_TO_COINGECKO_ID[symbol]; // BTC → bitcoin
  const url = `https://api.coingecko.com/api/v3/simple/price`;
  const params = { ids: coinId, vs_currencies: 'usd' };

  const response = await this.httpService.get(url, { params }).toPromise();
  return response.data[coinId].usd;
}
```

### Redis Cache Setup

```typescript
// app.module.ts
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300, // 5 minutes default
    }),
  ],
})
export class AppModule {}
```

---

## Design Requirements

### UI Indicators

- **Fresh Price** (<5min): No indicator, just price
- **Stale Price** (>5min): Amber badge "Stale"
- **Unavailable**: Gray badge "Unavailable"
- **Last Updated**: Small gray text with timestamp

### Loading States

- Skeleton loaders while fetching prices
- "Updating..." spinner during refresh
- Toast notification on successful batch update

### Error States

- Error banner at top of dashboard
- "Retry" button for manual refresh
- Contact support link if errors persist

---

## Definition of Done

- [ ] PriceService integrated with CoinGecko, Alpha Vantage, vnstock
- [ ] Redis cache implemented with 5-minute TTL
- [ ] Scheduled job running every 5 minutes to update prices
- [ ] API endpoints: `/api/prices/current`, `/api/prices/history/:symbol`
- [ ] Frontend: All mock price lookups replaced with API calls
- [ ] Stale data indicators displayed in UI
- [ ] Fallback to cached prices on API failure
- [ ] Rate limit handling with exponential backoff
- [ ] Unit tests for PriceService (>85% coverage)
- [ ] Integration tests for external API calls (mocked)
- [ ] E2E test: View holdings → See real prices from API
- [ ] Monitoring/logging for price fetch success rate
- [ ] Documentation: API source decision matrix, rate limits
- [ ] Performance: Price fetch <200ms (from cache), <1s (from API)

---

## Dependencies

- **Story 3-1**: Performance Dashboard (needs historical prices)
- **Story 3-2**: Asset Allocation (needs current prices)
- **Story 3-3**: Holdings Table Enhancements (needs current prices)
- **Story 3-4**: Asset Detail (needs OHLC data)

---

## Blockers & Risks

**Risk:** Free tier API rate limits too restrictive for user base  
**Mitigation:** Implement aggressive caching; upgrade to paid tier if needed; consider multiple API sources for redundancy

**Risk:** External APIs may be unreliable  
**Mitigation:** Multi-source fallback; alert on failure rate >10%; cache last known good prices

**Risk:** Historical data not available for all assets  
**Mitigation:** Fall back to current price repeated for historical view; clearly indicate "Limited data available"

---

## Notes

### API Key Management

Store API keys in environment variables:

```bash
COINGECKO_API_KEY=xxx  # Optional (free tier works without)
ALPHAVANTAGE_API_KEY=xxx
VNSTOCK_API_URL=http://localhost:8001  # Self-hosted
```

### Rate Limit Allowances (Free Tier)

- **CoinGecko**: 10-50 calls/min (no key required)
- **Alpha Vantage**: 5 calls/min, 500 calls/day
- **Twelve Data**: 8 calls/min, 800 calls/day

Strategy: Batch calls, aggressive caching, consider upgrading to paid tier once user base grows.

### Cost Estimation

- **CoinGecko Pro**: $129/month (10,000 calls/month)
- **Alpha Vantage Premium**: $49.99/month (unlimited calls)
- **Total**: ~$180/month for reliable price data (deferred until needed)

### Future Enhancements (Not in this story)

- WebSocket connections for real-time prices (Binance, Coinbase)
- Multiple API source failover
- Price data warehouse (ClickHouse) for advanced analytics
- Historical price backfill job

---

## Related Stories

- **Story 5-1: Multi-Source Price Ingestion** - Advanced ETL pipeline with ClickHouse
- **Story 5-2: ClickHouse Materialized Views** - Optimized price storage for scale
- **Story 6-2: FX Intelligence** - Uses price API patterns for FX rates
