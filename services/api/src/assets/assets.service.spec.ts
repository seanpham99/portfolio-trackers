import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: jest.fn((callback) => callback({ data: [], error: null })),
};

describe('AssetsService', () => {
  let service: AssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: 'SUPABASE_CLIENT', useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should search for assets', async () => {
    const mockData = [{ id: '1', symbol: 'AAPL', name_en: 'Apple Inc.' }];

    // Mock the chain resolution
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: 'SUPABASE_CLIENT', useValue: mockChain },
      ],
    }).compile();

    const serviceWithMock = module.get<AssetsService>(AssetsService);
    const result = await serviceWithMock.search('AAPL');
    expect(result).toEqual(mockData);
  });
});
