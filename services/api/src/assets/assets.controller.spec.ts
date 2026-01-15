import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: mockAssetsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call search', async () => {
    const mockResult = [{ id: '1', symbol: 'AAPL' }];
    mockAssetsService.search.mockResolvedValue(mockResult);

    const result = await controller.search('AAPL');
    expect(result).toEqual(mockResult);
    expect(mockAssetsService.search).toHaveBeenCalledWith('AAPL');
  });
});
