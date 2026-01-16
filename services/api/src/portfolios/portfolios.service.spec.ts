import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../common/cache';

// Mock portfolio data
const mockUserId = 'user-123';
const mockPortfolio: Portfolio = {
  id: 'portfolio-1',
  user_id: mockUserId,
  name: 'My Portfolio',
  base_currency: 'USD',
  description: 'Test portfolio',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

// Reusable mock chain factory
const createMockChain = () => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  };

  // Default behavior: single() returns { data: null, error: null }
  chain.single.mockResolvedValue({ data: null, error: null });

  // Default behavior: awaiting the chain returns { data: [], error: null }
  chain.then.mockImplementation((resolve: any) => {
    resolve({ data: [], error: null });
  });

  return chain;
};

// Mock Cache service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidatePortfolio: jest.fn(),
};

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let mockChain: any;

  beforeEach(async () => {
    mockChain = createMockChain();
    mockSupabaseClient.from.mockReturnValue(mockChain);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        {
          provide: 'SUPABASE_CLIENT',
          useValue: mockSupabaseClient,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePortfolioDto = {
      name: 'My Portfolio',
      base_currency: 'USD',
      description: 'Test portfolio',
    };

    it('should create a portfolio successfully', async () => {
      mockChain.single.mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockPortfolio);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolios');
      expect(mockChain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: createDto.name,
        base_currency: createDto.base_currency,
        description: createDto.description,
      });
      expect(mockCacheService.del).toHaveBeenCalledWith(
        `portfolios:${mockUserId}`,
      );
    });

    it('should throw ConflictException for duplicate name', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return cached portfolios if available', async () => {
      const mockPortfolios = [mockPortfolio];
      mockCacheService.get.mockResolvedValue(mockPortfolios);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockPortfolios);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        `portfolios:${mockUserId}`,
      );
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return all portfolios for user from DB with summary', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const mockPortfolios = [mockPortfolio];

      mockSupabaseClient.from.mockImplementation((table) => {
        const c = createMockChain();
        if (table === 'portfolios') {
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: mockPortfolios, error: null }),
          );
        } else if (table === 'transactions') {
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: [], error: null }),
          );
        }
        return c;
      });

      const result = await service.findAll(mockUserId);

      const expectedPortfolios = mockPortfolios.map((p) => ({
        ...p,
        netWorth: 0,
        change24h: 0,
        change24hPercent: 0,
        allocation: [],
      }));

      expect(result).toEqual(expectedPortfolios);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolios');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `portfolios:${mockUserId}`,
        expectedPortfolios,
      );
    });
  });

  describe('findOne', () => {
    it('should return a portfolio by id with summary', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        const c = createMockChain();
        if (table === 'portfolios') {
          c.single.mockResolvedValue({ data: mockPortfolio, error: null });
        } else if (table === 'transactions') {
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: [], error: null }),
          );
        }
        return c;
      });

      const result = await service.findOne(mockUserId, mockPortfolio.id);

      expect(result).toEqual({
        ...mockPortfolio,
        netWorth: 0,
        change24h: 0,
        change24hPercent: 0,
        allocation: [],
      });
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      await expect(
        service.findOne(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePortfolioDto = {
      name: 'Updated Portfolio',
    };

    it('should update a portfolio successfully', async () => {
      const updatedPortfolio = { ...mockPortfolio, name: 'Updated Portfolio' };
      const pChain = createMockChain();
      const txChain = createMockChain();

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'portfolios') return pChain;
        if (table === 'transactions') return txChain;
        return createMockChain();
      });

      // pChain.single is called:
      // 1. findOne -> portfolio check
      // 2. update -> result check
      pChain.single
        .mockResolvedValueOnce({ data: mockPortfolio, error: null })
        .mockResolvedValueOnce({ data: updatedPortfolio, error: null });

      // txChain.then (findOne tx query)
      txChain.then.mockImplementation((resolve: any) =>
        resolve({ data: [], error: null }),
      );

      const result = await service.update(
        mockUserId,
        mockPortfolio.id,
        updateDto,
      );

      expect(result).toEqual(updatedPortfolio);
      expect(mockCacheService.invalidatePortfolio).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });
  });

  describe('remove', () => {
    it('should delete a portfolio successfully', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        const c = createMockChain();
        if (table === 'portfolios') {
          c.single.mockResolvedValue({ data: mockPortfolio, error: null }); // findOne
          c.then.mockImplementation((resolve: any) => resolve({ error: null })); // delete
        } else if (table === 'transactions') {
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: [], error: null }),
          );
        }
        return c;
      });

      await expect(
        service.remove(mockUserId, mockPortfolio.id),
      ).resolves.toBeUndefined();

      expect(mockCacheService.invalidatePortfolio).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });

    it('should throw NotFoundException when portfolio to delete is not found', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      await expect(
        service.remove(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHoldings', () => {
    it('should aggregate holdings from transactions correctly', async () => {
      mockCacheService.get.mockResolvedValue(null); // No cache

      // Mock transactions with joined data
      const mockTransactions = [
        {
          asset_id: 'asset-1',
          quantity: 10,
          price: 100,
          type: 'BUY',
          total: 1000, // 10 * 100
          exchange_rate: 1,
          assets: {
            id: 'asset-1',
            symbol: 'AAPL',
            name_en: 'Apple',
            asset_class: 'US Equity',
            market: 'US',
            currency: 'USD',
          },
        },
        {
          asset_id: 'asset-1',
          quantity: 5,
          price: 120,
          type: 'BUY',
          total: 600, // 5 * 120
          exchange_rate: 1,
          assets: {
            id: 'asset-1',
            symbol: 'AAPL',
            name_en: 'Apple',
            asset_class: 'US Equity',
            market: 'US',
            currency: 'USD',
          },
        },
        {
          asset_id: 'asset-1',
          quantity: 5,
          price: 150,
          type: 'SELL',
          exchange_rate: 1,
          assets: {
            id: 'asset-1',
            symbol: 'AAPL',
            name_en: 'Apple',
            asset_class: 'US Equity',
            market: 'US',
            currency: 'USD',
          },
        },
      ];

      mockChain.then.mockImplementation((resolve: any) =>
        resolve({ data: mockTransactions, error: null }),
      );

      const result = await service.getHoldings(mockUserId);

      expect(result).toHaveLength(1);

      const aapl = result.find((h) => h.symbol === 'AAPL');
      expect(aapl).toBeDefined();
      expect(aapl!.total_quantity).toBe(10);
      // FIFO Logic Verification:
      // Buy 1: 10 @ 100.
      // Buy 2: 5 @ 120.
      // Sell 1: 5. FIFO removes from Buy 1 (Oldest).
      // Remaining: 5 @ 100 (from Buy 1) + 5 @ 120 (from Buy 2).
      // Total Qty: 10.
      // Total Cost: 500 + 600 = 1100.
      // Avg Cost: 1100 / 10 = 110.
      expect(aapl!.avg_cost).toBe(110);
    });

    it('should correctly handle FX conversion using the total column', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const mockTransactions = [
        {
          asset_id: 'asset-fx',
          quantity: 10,
          price: 10, // USD
          type: 'BUY',
          total: 100, // 10 * 10 (Asset Currency Total)
          exchange_rate: 23000,
          assets: {
            id: 'asset-fx',
            symbol: 'US-STOCK',
            name_en: 'US Stock',
            asset_class: 'US Equity',
            market: 'US',
            currency: 'USD',
          },
        },
      ];

      mockChain.then.mockImplementation((resolve: any) =>
        resolve({ data: mockTransactions, error: null }),
      );

      const result = await service.getHoldings(mockUserId);
      const output = result[0];

      // Avg Cost in Base Currency (VND)
      // 2,300,000 / 10 = 230,000 VND
      expect(output!.avg_cost).toBe(230000);
    });

    it('should include methodology transparency fields (calculationMethod and dataSource)', async () => {
      // Mock transactions
      const mockTransactions = [
        {
          asset_id: 'asset-1',
          quantity: 10,
          price: 100,
          type: 'BUY',
          assets: {
            id: 'asset-1',
            symbol: 'AAPL',
            name_en: 'Apple Inc.',
            asset_class: 'US Equity',
            market: 'US',
            currency: 'USD',
          },
        },
      ];

      mockChain.eq.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.getHoldings(mockUserId);

      expect(result).toHaveLength(1);
      const holding = result[0];
      if (!holding) throw new Error('Holding not found');

      // Verify methodology fields are populated
      expect(holding.calculationMethod).toBe('FIFO');
      expect(holding.dataSource).toBe('Manual Entry');
    });
  });

  describe('getAssetDetails', () => {
    it('should return detailed asset information and transaction history', async () => {
      const symbol = 'AAPL';
      const portfolioId = 'portfolio-1';

      const mockAsset = {
        id: 'asset-1',
        symbol: 'AAPL',
        name_en: 'Apple Inc.',
        asset_class: 'US Equity',
        market: 'US',
        currency: 'USD',
      };

      // Mock transactions for AAPL in this portfolio
      const mockTransactions = [
        {
          id: 'tx-1',
          asset_id: 'asset-1',
          quantity: 10,
          price: 150,
          fee: 5,
          total: 1505,
          exchange_rate: 1,
          type: 'BUY',
          transaction_date: '2025-01-01T00:00:00Z',
          assets: mockAsset,
        },
        {
          id: 'tx-2',
          asset_id: 'asset-1',
          quantity: 5,
          price: 200,
          fee: 5,
          total: 995, // (5 * 200) - 5
          exchange_rate: 1,
          type: 'SELL',
          transaction_date: '2025-01-02T00:00:00Z',
          assets: mockAsset,
        },
      ];

      mockSupabaseClient.from.mockImplementation((table) => {
        const c = createMockChain();
        if (table === 'portfolios') {
          c.single.mockResolvedValue({ data: mockPortfolio, error: null });
        } else if (table === 'transactions') {
          // getAssetDetails: calls from('transactions').select('..., assets!inner(...)')
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: mockTransactions, error: null }),
          );
        }
        return c;
      });

      const result = await service.getAssetDetails(
        mockUserId,
        portfolioId,
        symbol,
      );

      // Verify Transactions
      expect(result.transactions).toHaveLength(2);
      const tx1 = result.transactions[0];
      if (!tx1) throw new Error('Transaction 1 not found');
      expect(tx1.id).toBe('tx-1');

      // FIFO Verification
      // Buy 1: 10 @ 150 (Total 1500 + 5 fee = 1505). Lot 1: 10 units, cost 1505.
      // Sell 1: 5 @ 200.
      // FIFO consumes 5 from Lot 1.
      // Cost Basis Used: (1505 / 10) * 5 = 752.5.
      // Proceeds: (5 * 200) - 5 fee = 995.
      // Realized PL: 995 - 752.5 = 242.5.

      // Remaining: 5 units from Lot 1.
      // Remaining Cost: 1505 - 752.5 = 752.5.
      // Avg Cost: 752.5 / 5 = 150.5.

      // Current Value: 5 * 200 = 1000.
      // Unrealized PL (Asset Gain): 1000 - 752.5 = 247.5.

      expect(result.details.symbol).toBe('AAPL');
      expect(result.details.avg_cost).toBe(150.5);
      expect(result.details.total_quantity).toBe(5);
      expect(result.details.realized_pl).toBe(242.5);
      expect(result.details.asset_gain).toBe(247.5);
      expect(result.details.unrealized_pl).toBe(247.5);
      expect(result.details.calculation_method).toBe('FIFO');
    });

    it('should throw NotFoundException if asset has no transactions in portfolio', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        const c = createMockChain();
        if (table === 'portfolios') {
          c.single.mockResolvedValue({ data: mockPortfolio, error: null });
        } else if (table === 'transactions') {
          c.then.mockImplementation((resolve: any) =>
            resolve({ data: [], error: null }),
          );
        }
        return c;
      });

      await expect(
        service.getAssetDetails(mockUserId, 'pid', 'UNKNOWN'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
