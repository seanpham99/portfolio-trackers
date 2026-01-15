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

      expect(result).toEqual(mockPortfolio);
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
      mockPortfoliosService.findAll.mockResolvedValue(portfolios);

      const result = await controller.findAll(mockUserId);

      expect(result).toEqual(portfolios);
      expect(mockPortfoliosService.findAll).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no portfolios', async () => {
      mockPortfoliosService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUserId);

      expect(result).toEqual([]);
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

      mockPortfoliosService.getHoldings.mockResolvedValue(holdings);

      const result = await controller.getHoldings(mockUserId);

      expect(result).toEqual(holdings);
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

      mockPortfoliosService.getHoldings.mockResolvedValue(holdings);

      const result = await controller.getPortfolioHoldings(
        mockUserId,
        mockPortfolio.id,
      );

      expect(result).toEqual(holdings);
      expect(mockPortfoliosService.getHoldings).toHaveBeenCalledWith(
        mockUserId,
        mockPortfolio.id,
      );
    });
  });

  describe('findOne', () => {
    it('should return a portfolio by id', async () => {
      mockPortfoliosService.findOne.mockResolvedValue(mockPortfolio);

      const result = await controller.findOne(mockUserId, mockPortfolio.id);

      expect(result).toEqual(mockPortfolio);
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
        controller.findOne(mockUserId, 'non-existent-id'),
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

      expect(result).toEqual(updatedPortfolio);
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

      expect(result).toEqual(mockTransaction);
      expect(mockPortfoliosService.addTransaction).toHaveBeenCalledWith(
        mockUserId,
        'portfolio-1',
        createTransactionDto,
      );
    });
  });
});
