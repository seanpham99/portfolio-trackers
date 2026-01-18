import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import {
  CreateTransactionDto,
  TransactionType,
} from '@workspace/shared-types/api';
import { Portfolio } from './portfolio.entity';
import { AuthGuard } from './guards';

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

// Mock transaction data
const mockTransaction = {
  id: 'tx-1',
  portfolio_id: 'portfolio-1',
  asset_id: 'asset-1',
  type: TransactionType.BUY,
  quantity: 10,
  price: 150,
  fee: 0,
  transaction_date: '2025-01-01T00:00:00Z',
};

// Mock PortfoliosService
const mockPortfoliosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addTransaction: jest.fn(),
  getHoldings: jest.fn(),
  getPortfolioHoldings: jest.fn(),
  getAssetDetails: jest.fn(),
};

describe('PortfoliosController', () => {
  let controller: PortfoliosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [
        {
          provide: PortfoliosService,
          useValue: mockPortfoliosService,
        },
        {
          provide: 'SUPABASE_CLIENT',
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PortfoliosController>(PortfoliosController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a portfolio', async () => {
      const createDto: CreatePortfolioDto = {
        name: 'My Portfolio',
        base_currency: 'USD',
        description: 'Test portfolio',
      };

      mockPortfoliosService.create.mockResolvedValue(mockPortfolio);

      const result = await controller.create(mockUserId, createDto);

      expect(result).toEqual({
        data: mockPortfolio,
        success: true,
        meta: {},
      });
      expect(mockPortfoliosService.create).toHaveBeenCalledWith(
        mockUserId,
        createDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return all portfolios for user', async () => {
      const portfolios = [
        {
          ...mockPortfolio,
          netWorth: 1000,
          change24h: 50,
          change24hPercent: 5,
          allocation: [],
        },
      ];
      // Mock service returning { data, meta }
      mockPortfoliosService.findAll.mockResolvedValue({
        data: portfolios,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });

      const result = await controller.findAll(mockUserId, false);

      expect(result).toEqual({
        data: portfolios,
        success: true,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });
      expect(mockPortfoliosService.findAll).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no portfolios', async () => {
      mockPortfoliosService.findAll.mockResolvedValue({
        data: [],
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });

      const result = await controller.findAll(mockUserId, false);

      expect(result).toEqual({
        data: [],
        success: true,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });
    });
  });

  describe('getHoldings', () => {
    it('should return aggregated holdings', async () => {
      const holdings = [
        {
          asset_id: 'asset-1',
          symbol: 'AAPL',
          name: 'Apple',
          asset_class: 'US Equity',
          total_quantity: 10,
          avg_cost: 150,
        },
      ];

      mockPortfoliosService.getHoldings.mockResolvedValue({
        data: holdings,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });

      const result = await controller.getHoldings(mockUserId, false);

      expect(result).toEqual({
        data: holdings,
        success: true,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });
      expect(mockPortfoliosService.getHoldings).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });

  describe('getPortfolioHoldings', () => {
    it('should return holdings for specific portfolio', async () => {
      const holdings = [
        {
          asset_id: 'asset-1',
          symbol: 'AAPL',
          ...mockPortfolio, // just filling
          total_quantity: 5,
          avg_cost: 100,
        },
      ];

      mockPortfoliosService.getHoldings.mockResolvedValue({
        data: holdings,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });

      const result = await controller.getPortfolioHoldings(
        mockUserId,
        mockPortfolio.id,
        false,
      );

      expect(result).toEqual({
        data: holdings,
        success: true,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });
      expect(mockPortfoliosService.getHoldings).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });
  });

  describe('findOne', () => {
    it('should return a portfolio by id', async () => {
      mockPortfoliosService.findOne.mockResolvedValue({
        data: mockPortfolio,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });

      const result = await controller.findOne(
        mockUserId,
        mockPortfolio.id,
        false,
      );

      expect(result).toEqual({
        data: mockPortfolio,
        success: true,
        meta: { staleness: '2025-01-01T12:00:00Z' },
      });
      expect(mockPortfoliosService.findOne).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      mockPortfoliosService.findOne.mockRejectedValue(
        new NotFoundException('Portfolio not found'),
      );

      await expect(
        controller.findOne(mockUserId, 'non-existent-id', false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      const updateDto: UpdatePortfolioDto = {
        name: 'Updated Portfolio',
      };
      const updatedPortfolio = { ...mockPortfolio, name: 'Updated Portfolio' };

      mockPortfoliosService.update.mockResolvedValue(updatedPortfolio);

      const result = await controller.update(
        mockUserId,
        mockPortfolio.id,
        updateDto,
      );

      expect(result).toEqual({
        data: updatedPortfolio,
        success: true,
        meta: {},
      });
      expect(mockPortfoliosService.update).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a portfolio', async () => {
      mockPortfoliosService.remove.mockResolvedValue(undefined);

      await controller.remove(mockUserId, mockPortfolio.id);

      expect(mockPortfoliosService.remove).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });

    it('should throw NotFoundException when portfolio to delete not found', async () => {
      mockPortfoliosService.remove.mockRejectedValue(
        new NotFoundException('Portfolio not found'),
      );

      await expect(
        controller.remove(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addTransaction', () => {
    it('should add a transaction to portfolio', async () => {
      const createTransactionDto: CreateTransactionDto = {
        portfolio_id: 'portfolio-1',
        asset_id: 'asset-1',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fee: 0,
      };

      mockPortfoliosService.addTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.addTransaction(
        mockUserId,
        'portfolio-1',
        createTransactionDto,
      );

      expect(result).toEqual({
        data: mockTransaction,
        success: true,
        meta: {},
      });
      expect(mockPortfoliosService.addTransaction).toHaveBeenCalledWith(
        mockUserId,
        'portfolio-1',
        createTransactionDto,
      );
    });
  });
});
