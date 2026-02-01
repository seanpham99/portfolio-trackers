import { Test, TestingModule } from '@nestjs/testing';
import { SyncSchedulerService } from './sync-scheduler.service';
import { ConnectionsService } from './connections.service';
import { ExchangeSyncService } from './exchange-sync.service';

describe('SyncSchedulerService', () => {
  let service: SyncSchedulerService;
  let connectionsService: jest.Mocked<ConnectionsService>;
  let exchangeSyncService: jest.Mocked<ExchangeSyncService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncSchedulerService,
        {
          provide: ConnectionsService,
          useValue: {
            findAllActive: jest.fn(),
          },
        },
        {
          provide: ExchangeSyncService,
          useValue: {
            syncHoldings: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncSchedulerService>(SyncSchedulerService);
    connectionsService = module.get(ConnectionsService);
    exchangeSyncService = module.get(ExchangeSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sync all active connections', async () => {
    const connections = [
      { id: '1', user_id: 'u1' },
      { id: '2', user_id: 'u2' },
    ];
    connectionsService.findAllActive.mockResolvedValue(connections);
    exchangeSyncService.syncHoldings.mockResolvedValue({
      success: true,
      assetsSync: 1,
      syncedBalances: [],
    });

    await service.handleCron();

    expect(connectionsService.findAllActive).toHaveBeenCalled();
    expect(exchangeSyncService.syncHoldings).toHaveBeenCalledTimes(2);
    expect(exchangeSyncService.syncHoldings).toHaveBeenCalledWith('u1', '1');
    expect(exchangeSyncService.syncHoldings).toHaveBeenCalledWith('u2', '2');
  });

  it('should handle sync failures gracefully', async () => {
    const connections = [{ id: '1', user_id: 'u1' }];
    connectionsService.findAllActive.mockResolvedValue(connections);
    exchangeSyncService.syncHoldings.mockResolvedValue({
      success: false,
      assetsSync: 0,
      syncedBalances: [],
      error: 'Sync failed',
    });

    await service.handleCron();

    expect(exchangeSyncService.syncHoldings).toHaveBeenCalled();
    // Should not throw
  });

  it('should respect concurrency limit', async () => {
    const CONCURRENCY = 5; // From service definition
    const TOTAL_CONNECTIONS = 10;

    // Create 10 connections
    const connections = Array.from({ length: TOTAL_CONNECTIONS }, (_, i) => ({
      id: `${i}`,
      user_id: `u${i}`,
    }));
    connectionsService.findAllActive.mockResolvedValue(connections);

    // Create a mechanism to track running tasks
    let runningCount = 0;
    let maxRunning = 0;

    exchangeSyncService.syncHoldings.mockImplementation(async () => {
      runningCount++;
      maxRunning = Math.max(maxRunning, runningCount);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 50));

      runningCount--;
      return { success: true, assetsSync: 0, syncedBalances: [] };
    });

    await service.handleCron();

    expect(maxRunning).toBeLessThanOrEqual(CONCURRENCY);
    expect(exchangeSyncService.syncHoldings).toHaveBeenCalledTimes(
      TOTAL_CONNECTIONS,
    );
  });
});
