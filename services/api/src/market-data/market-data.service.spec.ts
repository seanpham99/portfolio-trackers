import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';
import { CacheService } from '../common/cache';
import { CacheService } from '../common/cache';

// Mock Yahoo Finance with a class constructor
const mockQuote = jest.fn();
const mockChart = jest.fn();
const mockSuppressNotices = jest.fn();

jest.mock('yahoo-finance2', () => {
  return {
    __esModule: true,
    default: class MockYahooFinance {
      quote = mockQuote;
      chart = mockChart;
      suppressNotices = mockSuppressNotices;
    },
  };
});

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

    beforeEach(() => {
      mockChart.mockReset();
    });

    it('should return 1 if currencies are the same', async () => {
      const rate = await service.getHistoricalExchangeRate('USD', 'USD', date);
      expect(rate).toBe(1);
    });

    it('should return cached rate if available', async () => {
      mockCacheService.get.mockResolvedValue(23500);

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBe(23500);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockChart).not.toHaveBeenCalled();
    });

    it('should fetch from Yahoo Finance if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockChart.mockResolvedValue({
        quotes: [{ close: 23450 }],
      });

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBe(23450);
      expect(mockChart).toHaveBeenCalledWith(
        'USDVND=X',
        expect.objectContaining({ period1: '2023-01-15' }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, 23450, 604800);
    });

    it('should return null if Yahoo Finance returns empty', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockChart.mockResolvedValue({ quotes: [] });

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBeNull();
    });

    it('should return null if Yahoo Finance throws error', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockChart.mockRejectedValue(new Error('API Error'));

      const rate = await service.getHistoricalExchangeRate(from, to, date);

      expect(rate).toBeNull();
    });
  });

  describe('getQuoteWithMetadata - Provider Down Scenarios (NFR3/NFR8)', () => {
    const symbol = 'AAPL';
    const cacheKey = 'quote:metadata:AAPL';
    const fallbackKey = 'quote:fallback:AAPL';

    beforeEach(() => {
      // Reset mocks
      mockCacheService.get.mockReset();
      mockCacheService.set.mockReset();
    });

    it('should return fresh quote from Yahoo Finance when available', async () => {
      mockCacheService.get.mockResolvedValue(null);

      // Access private yf through service
      const mockQuote = {
        regularMarketPrice: 175.5,
        regularMarketChange: 2.25,
        regularMarketChangePercent: 1.3,
        regularMarketPreviousClose: 173.25,
      };
      (service as any).yf.quote = jest.fn().mockResolvedValue(mockQuote);

      const result = await service.getQuoteWithMetadata(symbol);

      expect(result).toBeDefined();
      expect(result?.price).toBe(175.5);
      expect(result?.regularMarketChange).toBe(2.25);
      expect(result?.regularMarketChangePercent).toBe(1.3);
      expect(result?.isStale).toBe(false);
      expect(result?.providerStatus).toBe('live');
      expect(result?.provider).toBe('Yahoo');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        cacheKey,
        expect.objectContaining({ price: 175.5 }),
        300,
      );
    });

    it('should return cached quote when available (no API call)', async () => {
      const cachedQuote = {
        price: 170.0,
        regularMarketChange: 1.5,
        regularMarketChangePercent: 0.89,
        previousClose: 168.5,
        isStale: false,
        lastUpdated: new Date().toISOString(),
        providerStatus: 'live',
        provider: 'Yahoo',
      };
      mockCacheService.get.mockResolvedValue(cachedQuote);

      const result = await service.getQuoteWithMetadata(symbol);

      expect(result).toEqual(cachedQuote);
      // yf.quote should not be called when cached
    });

    it('should return stale fallback when provider is down after retries (NFR3)', async () => {
      // No fresh cache
      mockCacheService.get
        .mockResolvedValueOnce(null) // First call for fresh cache
        .mockResolvedValueOnce({
          // Second call for stale fallback
          price: 165.0,
          regularMarketChange: -2.0,
          regularMarketChangePercent: -1.2,
          previousClose: 167.0,
          isStale: false,
          lastUpdated: '2024-01-01T10:00:00.000Z',
          providerStatus: 'live',
          provider: 'Yahoo',
        });

      // Simulate provider down - all retries fail
      (service as any).yf.quote = jest
        .fn()
        .mockRejectedValue(new Error('Service Unavailable'));

      const result = await service.getQuoteWithMetadata(symbol);

      expect(result).toBeDefined();
      expect(result?.price).toBe(165.0);
      expect(result?.isStale).toBe(true);
      expect(result?.providerStatus).toBe('fallback');
      expect(result?.provider).toBe('cached');
    });

    it('should return null when provider is down and no fallback cached (NFR8)', async () => {
      // No cache at all
      mockCacheService.get.mockResolvedValue(null);

      // Provider completely down
      (service as any).yf.quote = jest
        .fn()
        .mockRejectedValue(new Error('Network Error'));

      const result = await service.getQuoteWithMetadata(symbol);

      expect(result).toBeNull();
    });

    it('should retry with exponential backoff on transient failures (NFR8)', async () => {
      mockCacheService.get.mockResolvedValue(null);

      // First 2 calls fail, third succeeds
      const mockQuote = {
        regularMarketPrice: 180.0,
        regularMarketChange: 3.0,
        regularMarketChangePercent: 1.7,
        regularMarketPreviousClose: 177.0,
      };
      (service as any).yf.quote = jest
        .fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Rate Limited'))
        .mockResolvedValueOnce(mockQuote);

      const result = await service.getQuoteWithMetadata(symbol);

      expect(result).toBeDefined();
      expect(result?.price).toBe(180.0);
      expect(result?.isStale).toBe(false);
      expect((service as any).yf.quote).toHaveBeenCalledTimes(3);
    });
  });
});
