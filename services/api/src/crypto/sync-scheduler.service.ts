import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConnectionsService } from './connections.service';
import { ExchangeSyncService } from './exchange-sync.service';
import pLimit from 'p-limit';

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name);
  private readonly CONCURRENCY_LIMIT = 5;

  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly exchangeSyncService: ExchangeSyncService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Starting background sync...');
    const connections = await this.connectionsService.findAllActive();
    this.logger.debug(`Found ${connections.length} active connections to sync`);

    const limit = pLimit(this.CONCURRENCY_LIMIT);

    const results = await Promise.allSettled(
      connections.map((conn) =>
        limit(async () => {
          try {
            const res = await this.exchangeSyncService.syncHoldings(
              conn.user_id,
              conn.id,
            );
            if (!res.success) {
              this.logger.warn(
                `Sync failed for connection ${conn.id}: ${res.error}`,
              );
              throw new Error(res.error);
            }
            return res;
          } catch (error) {
            this.logger.warn(
              `Sync failed for connection ${conn.id}: ${(error as Error).message}`,
            );
            throw error;
          }
        }),
      ),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.debug(
      `Sync complete. Success: ${success}/${connections.length}`,
    );
  }
}
