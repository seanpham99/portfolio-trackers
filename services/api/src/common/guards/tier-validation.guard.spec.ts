import { Test, TestingModule } from '@nestjs/testing';
import { TierValidationGuard } from './tier-validation.guard';
import { UsersService } from '../../users/users.service';
import { PortfoliosService } from '../../portfolios/portfolios.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { Users } from '@workspace/shared-types/database';

describe('TierValidationGuard', () => {
  let guard: TierValidationGuard;
  let usersService: UsersService;
  let portfoliosService: PortfoliosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierValidationGuard,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PortfoliosService,
          useValue: {
            countByUser: jest.fn(),
            countAssetsByUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TierValidationGuard>(TierValidationGuard);
    usersService = module.get<UsersService>(UsersService);
    portfoliosService = module.get<PortfoliosService>(PortfoliosService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('Portfolio creation limit', () => {
    it('should allow creating a portfolio if under free tier limit', async () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-uuid' },
            route: { path: '/portfolios' },
            method: 'POST',
          }),
        }),
      });
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(createMock<Users>({ subscription_tier: 'free' }));
      jest.spyOn(portfoliosService, 'countByUser').mockResolvedValue(0);

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('should deny creating a portfolio if at free tier limit', async () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-uuid' },
            route: { path: '/portfolios' },
            method: 'POST',
          }),
        }),
      });
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(createMock<Users>({ subscription_tier: 'free' }));
      jest.spyOn(portfoliosService, 'countByUser').mockResolvedValue(1);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Asset creation limit', () => {
    it('should allow creating an asset if under free tier limit', async () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-uuid' },
            route: { path: '/portfolios/some-id/transactions' },
            method: 'POST',
          }),
        }),
      });
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(createMock<Users>({ subscription_tier: 'free' }));
      jest.spyOn(portfoliosService, 'countAssetsByUser').mockResolvedValue(19);

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('should deny creating an asset if at free tier limit', async () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-uuid' },
            route: { path: '/portfolios/some-id/transactions' },
            method: 'POST',
          }),
        }),
      });
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(createMock<Users>({ subscription_tier: 'free' }));
      jest.spyOn(portfoliosService, 'countAssetsByUser').mockResolvedValue(20);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  it('should allow pro users to bypass all checks', async () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-uuid' },
          route: { path: '/portfolios' },
          method: 'POST',
        }),
      }),
    });
    jest
      .spyOn(usersService, 'findOne')
      .mockResolvedValue(createMock<Users>({ subscription_tier: 'pro' }));

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(portfoliosService.countByUser).not.toHaveBeenCalled();
  });
});
