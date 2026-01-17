import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from './discovery.service';
import { CacheService } from '../common/cache';
import { DiscoverableAssetClass } from '@workspace/shared-types';

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn(),
  }));
});

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let cacheService: jest.Mocked<CacheService>;
  let mockSupabase: any;

  beforeEach(async () => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      invalidatePattern: jest.fn(),
      invalidatePortfolio: jest.fn(),
      isAvailable: jest.fn(),
    } as any;

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        {
          provide: 'SUPABASE_CLIENT',
          useValue: mockSupabase,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  describe('searchExternal', () => {
    it('should return cached results if available', async () => {
      const cachedResults = [
        { symbol: 'AAPL', name_en: 'Apple Inc.', source: 'yahoo_finance' },
      ];
      cacheService.get.mockResolvedValue(cachedResults as any);

      const results = await service.searchExternal(
        'AAPL',
        DiscoverableAssetClass.US_STOCK,
      );

      expect(results).toEqual(cachedResults);
      expect(cacheService.get).toHaveBeenCalledWith('discover:US_STOCK:aapl');
    });

    it('should return empty array on external search failure', async () => {
      cacheService.get.mockResolvedValue(null);
      // Yahoo Finance mock will throw by default

      const results = await service.searchExternal(
        'INVALID',
        DiscoverableAssetClass.US_STOCK,
      );

      expect(results).toEqual([]);
    });
  });

  describe('submitAssetRequest', () => {
    it('should create pending asset request successfully', async () => {
      const mockPendingAsset = {
        id: '123',
        symbol: 'VIC',
        asset_class: 'VN_STOCK',
        requested_by: 'user-123',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPendingAsset,
        error: null,
      });

      const result = await service.submitAssetRequest(
        'VIC',
        'VN_STOCK',
        'user-123',
      );

      expect(result).toEqual(mockPendingAsset);
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_assets');
    });

    it('should throw error for duplicate request', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      });

      await expect(
        service.submitAssetRequest('VIC', 'VN_STOCK', 'user-123'),
      ).rejects.toThrow('already requested');
    });
  });

  describe('hasExistingRequest', () => {
    it('should return true if request exists', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: '123' },
        error: null,
      });

      const result = await service.hasExistingRequest(
        'VIC',
        'VN_STOCK',
        'user-123',
      );

      expect(result).toBe(true);
    });

    it('should return false if no request exists', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.hasExistingRequest(
        'VIC',
        'VN_STOCK',
        'user-123',
      );

      expect(result).toBe(false);
    });
  });

  describe('mapping logic', () => {
    it('should correctly map VN stocks', async () => {
      // Access private method via casting
      const result = (service as any).mapYahooToDiscoveredAsset(
        {
          symbol: 'VIC.VN',
          longname: 'Vingroup',
          quoteType: 'EQUITY',
        },
        DiscoverableAssetClass.VN_STOCK,
      );

      expect(result.market).toBe('VN');
      expect(result.currency).toBe('VND');
    });

    it('should correctly map US stocks', async () => {
      const result = (service as any).mapYahooToDiscoveredAsset(
        {
          symbol: 'AAPL',
          longname: 'Apple Inc.',
          quoteType: 'EQUITY',
        },
        DiscoverableAssetClass.US_STOCK,
      );

      expect(result.market).toBe('US');
      expect(result.currency).toBe('USD');
    });
  });

  describe('backoff logic', () => {
    it('should retry on 429 from CoinGecko', async () => {
      // Mock fetch global
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ coins: [] }),
        } as Response);

      const toSpy = jest.spyOn(service as any, 'fetchWithBackoff');

      await service.searchExternal('BTC', DiscoverableAssetClass.CRYPTO);

      // Should have called fetchWithBackoff
      expect(toSpy).toHaveBeenCalled();
      // fetch should have been called twice (1 failure + 1 success)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
