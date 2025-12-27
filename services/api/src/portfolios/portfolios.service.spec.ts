import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto';
import { Portfolio } from './portfolio.entity';
import { CacheService } from '../cache';

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

// Mock Cache service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidatePortfolio: jest.fn(),
};

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  beforeEach(async () => {
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
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockPortfolio);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolios');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: createDto.name,
        base_currency: createDto.base_currency,
        description: createDto.description,
      });
      expect(mockCacheService.del).toHaveBeenCalledWith(`portfolios:${mockUserId}`);
    });

    it('should throw ConflictException for duplicate name', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

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
      expect(mockCacheService.get).toHaveBeenCalledWith(`portfolios:${mockUserId}`);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return all portfolios for user from DB and cache them', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const mockPortfolios = [mockPortfolio];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockPortfolios,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockPortfolios);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolios');
      expect(mockCacheService.set).toHaveBeenCalledWith(`portfolios:${mockUserId}`, mockPortfolios);
    });
  });

  describe('findOne', () => {
    it('should return a portfolio by id', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1,
        single: mockSingle,
      });

      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      const result = await service.findOne(mockUserId, mockPortfolio.id);

      expect(result).toEqual(mockPortfolio);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1,
        single: mockSingle,
      });

      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

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

      // Mock findOne first
      const mockSelectFind = jest.fn().mockReturnThis();
      const mockEqFind1 = jest.fn().mockReturnThis();
      const mockEqFind2 = jest.fn().mockReturnThis();
      const mockSingleFind = jest.fn().mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEqUpdate1 = jest.fn().mockReturnThis();
      const mockEqUpdate2 = jest.fn().mockReturnThis();
      const mockSelectUpdate = jest.fn().mockReturnThis();
      const mockSingleUpdate = jest.fn().mockResolvedValue({
        data: updatedPortfolio,
        error: null,
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // findOne call
          mockSelectFind.mockReturnValue({ eq: mockEqFind1 });
          mockEqFind1.mockReturnValue({ eq: mockEqFind2 });
          mockEqFind2.mockReturnValue({ single: mockSingleFind });
          return { select: mockSelectFind };
        } else {
          // update call
          mockUpdate.mockReturnValue({ eq: mockEqUpdate1 });
          mockEqUpdate1.mockReturnValue({ eq: mockEqUpdate2 });
          mockEqUpdate2.mockReturnValue({ select: mockSelectUpdate });
          mockSelectUpdate.mockReturnValue({ single: mockSingleUpdate });
          return { update: mockUpdate };
        }
      });

      const result = await service.update(
        mockUserId,
        mockPortfolio.id,
        updateDto,
      );

      expect(result).toEqual(updatedPortfolio);
      expect(mockCacheService.invalidatePortfolio).toHaveBeenCalledWith(mockUserId, mockPortfolio.id);
    });
  });

  describe('remove', () => {
    it('should delete a portfolio successfully', async () => {
      // Mock findOne first
      const mockSelectFind = jest.fn().mockReturnThis();
      const mockEqFind1 = jest.fn().mockReturnThis();
      const mockEqFind2 = jest.fn().mockReturnThis();
      const mockSingleFind = jest.fn().mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      // Mock delete
      const mockDelete = jest.fn().mockReturnThis();
      const mockEqDelete1 = jest.fn().mockReturnThis();
      const mockEqDelete2 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // findOne call
          mockSelectFind.mockReturnValue({ eq: mockEqFind1 });
          mockEqFind1.mockReturnValue({ eq: mockEqFind2 });
          mockEqFind2.mockReturnValue({ single: mockSingleFind });
          return { select: mockSelectFind };
        } else {
          // delete call
          mockDelete.mockReturnValue({ eq: mockEqDelete1 });
          mockEqDelete1.mockReturnValue({ eq: mockEqDelete2 });
          return { delete: mockDelete };
        }
      });

      await expect(
        service.remove(mockUserId, mockPortfolio.id),
      ).resolves.toBeUndefined();
      
      expect(mockCacheService.invalidatePortfolio).toHaveBeenCalledWith(mockUserId, mockPortfolio.id);
    });

    it('should throw NotFoundException when portfolio to delete is not found', async () => {
      const mockSelectFind = jest.fn().mockReturnThis();
      const mockEqFind1 = jest.fn().mockReturnThis();
      const mockEqFind2 = jest.fn().mockReturnThis();
      const mockSingleFind = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelectFind,
      });
      mockSelectFind.mockReturnValue({ eq: mockEqFind1 });
      mockEqFind1.mockReturnValue({ eq: mockEqFind2 });
      mockEqFind2.mockReturnValue({ single: mockSingleFind });

      await expect(
        service.remove(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
