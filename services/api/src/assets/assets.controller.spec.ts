import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { DiscoveryService } from './discovery.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DiscoverableAssetClass } from '@workspace/shared-types/database';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = {
    search: jest.fn(),
    findBySymbol: jest.fn(),
    getPopular: jest.fn(),
  };

  const mockDiscoveryService = {
    searchExternal: jest.fn(),
    submitAssetRequest: jest.fn(),
    hasExistingRequest: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-123', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        { provide: AssetsService, useValue: mockAssetsService },
        { provide: DiscoveryService, useValue: mockDiscoveryService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssetsController>(AssetsController);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Search tests ---
  describe('search', () => {
    it('should call assetsService.search with query', async () => {
      const mockResult = [{ id: '1', symbol: 'AAPL' }];
      mockAssetsService.search.mockResolvedValue(mockResult);

      const result = await controller.search('AAPL');

      expect(result.data).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(mockAssetsService.search).toHaveBeenCalledWith('AAPL');
    });
  });

  // --- Discover tests ---
  describe('discover', () => {
    it('should return discovered assets from external provider', async () => {
      const mockResults = [
        { symbol: 'AAPL', name_en: 'Apple Inc.', source: 'yahoo_finance' },
      ];
      mockDiscoveryService.searchExternal.mockResolvedValue(mockResults);

      const result = await controller.discover(
        'AAPL',
        DiscoverableAssetClass.US_STOCK,
      );

      expect(result.data).toEqual(mockResults);
      expect(result.success).toBe(true);
      expect(mockDiscoveryService.searchExternal).toHaveBeenCalledWith(
        'AAPL',
        DiscoverableAssetClass.US_STOCK,
      );
    });

    it('should throw BadRequestException for empty query', async () => {
      await expect(
        controller.discover('', DiscoverableAssetClass.US_STOCK),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid assetClass', async () => {
      await expect(
        controller.discover('AAPL', 'INVALID_CLASS' as DiscoverableAssetClass),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // --- Submit Request tests ---
  describe('submitRequest', () => {
    const validDto = {
      symbol: 'VIC',
      assetClass: DiscoverableAssetClass.VN_STOCK,
    };

    it('should submit asset request successfully', async () => {
      mockDiscoveryService.hasExistingRequest.mockResolvedValue(false);
      mockDiscoveryService.submitAssetRequest.mockResolvedValue({
        id: 'pending-123',
        symbol: 'VIC',
        status: 'pending',
      });

      const result = await controller.submitRequest(validDto, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'pending-123',
        symbol: 'VIC',
        status: 'pending',
        message: expect.stringContaining('VIC'),
      });
      expect(mockDiscoveryService.hasExistingRequest).toHaveBeenCalledWith(
        'VIC',
        DiscoverableAssetClass.VN_STOCK,
        'user-123',
      );
    });

    it('should throw ConflictException if user already requested', async () => {
      mockDiscoveryService.hasExistingRequest.mockResolvedValue(true);

      await expect(
        controller.submitRequest(validDto, mockRequest),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle null status from database', async () => {
      mockDiscoveryService.hasExistingRequest.mockResolvedValue(false);
      mockDiscoveryService.submitAssetRequest.mockResolvedValue({
        id: 'pending-123',
        symbol: 'VIC',
        status: null, // DB can return null
      });

      const result = await controller.submitRequest(validDto, mockRequest);

      expect(result.data.status).toBe('pending'); // Should default to 'pending'
    });
  });
});
