import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';
import { CacheService } from '../common/cache';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Yahoo Finance
jest.mock('yahoo-finance2', () => {
  return {
    __esModule: true,
    default: {
      historical: jest.fn(),
      suppressNotices: jest.fn(),
    },
  };
});
import YahooFinance from 'yahoo-finance2';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let cacheService: CacheService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: 'SUPABASE_CLIENT', useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
    cacheService = module.get<CacheService>(CacheService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHistoricalExchangeRate', () => {
    const from = 'USD';
    const to = 'VND';
    const date = new Date('2023-01-15');
    const cacheKey = 'fx:rate:USD:VND:2023-01-15';

    it('should return 1 if currencies are the same', async () => {
      const rate = await service.getHistoricalExchangeRate('USD', 'USD', date);
      expect(rate).toBe(1);
    });

    it('should return cached rate if available', async () => {
      mockCacheService.get.mockResolvedValue(23500);

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBe(23500);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(YahooFinance.historical).not.toHaveBeenCalled();
    });

    it('should fetch from Yahoo Finance if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      (YahooFinance.historical as unknown as jest.Mock).mockResolvedValue([
        { date: '2023-01-15', close: 23450 },
      ]);

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBe(23450);
      expect(YahooFinance.historical).toHaveBeenCalledWith(
        'USDVND=X',
        expect.objectContaining({ period1: '2023-01-15' }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, 23450, 604800);
    });

    it('should return null if Yahoo Finance returns empty', async () => {
      mockCacheService.get.mockResolvedValue(null);
      (YahooFinance.historical as unknown as jest.Mock).mockResolvedValue([]);

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBeNull();
    });

    it('should return null if Yahoo Finance throws error', async () => {
      mockCacheService.get.mockResolvedValue(null);
      (YahooFinance.historical as unknown as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBeNull();
    });
  });
});
