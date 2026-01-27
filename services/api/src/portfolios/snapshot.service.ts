import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@workspace/shared-types/database';
import {
  PortfolioSnapshotDto,
  PortfolioHistoryResponseDto,
} from '@workspace/shared-types/api';
import { PortfoliosService } from './portfolios.service';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient<Database>,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
  ) {}

  /**
   * Capture a snapshot of the current portfolio state
   * Returns null if capture failed or was skipped
   */
  async captureSnapshot(
    userId: string,
    portfolioId: string,
    trigger: 'manual' | 'daily_job' | 'user_view' = 'manual',
  ): Promise<PortfolioSnapshotDto | null> {
    try {
      // 1. Get current portfolio state (force refresh to get latest prices)
      // We use findOne to reuse existing robust calculation logic
      const { data: portfolio } = await this.portfoliosService.findOne(
        userId,
        portfolioId,
        true, // force refresh
      );

      if (!portfolio) {
        this.logger.warn(
          `Portfolio ${portfolioId} not found for user ${userId}, skipping snapshot`,
        );
        return null;
      }

      // 2. Prepare snapshot data
      const snapshot: Database['public']['Tables']['portfolio_snapshots']['Insert'] =
        {
          portfolio_id: portfolioId,
          user_id: userId,
          net_worth: portfolio.netWorth,
          total_cost: portfolio.totalCostBasis || 0,
          metadata: {
            trigger,
            provider_status: portfolio.providerStatus,
            asset_allocation: portfolio.allocation, // Store simplified allocation for future analysis
            currency: portfolio.base_currency,
          },
          timestamp: new Date().toISOString(),
        };

      // 3. Insert into DB
      const { data, error } = await this.supabase
        .from('portfolio_snapshots')
        .insert(snapshot)
        .select()
        .single();

      if (error) {
        this.logger.error(
          `Failed to persist snapshot for portfolio ${portfolioId}: ${error.message}`,
        );
        return null;
      }

      this.logger.debug(
        `Captured snapshot for portfolio ${portfolioId} (Net Worth: ${portfolio.netWorth})`,
      );

      return data as PortfolioSnapshotDto;
    } catch (error: any) {
      this.logger.error(
        `Error capturing snapshot for portfolio ${portfolioId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Check if a snapshot is needed (i.e., last snapshot > 24h old)
   */
  async shouldCapture(portfolioId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('portfolio_snapshots')
      .select('timestamp')
      .eq('portfolio_id', portfolioId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Real error (not just not found)
      this.logger.warn(`Error checking last snapshot: ${error.message}`);
      return false; // Fail safe: don't spam snapshots on error
    }

    if (!data) {
      return true; // No snapshots yet
    }

    const lastSnapshot = new Date(data.timestamp).getTime();
    const now = Date.now();
    const hoursSince = (now - lastSnapshot) / (1000 * 60 * 60);

    return hoursSince >= 24;
  }

  /**
   * Get history for a portfolio
   */
  async getHistory(
    userId: string,
    portfolioId: string,
    range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1M',
  ): Promise<PortfolioHistoryResponseDto> {
    let query = this.supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    // Apply time filter
    const now = new Date();
    let startDate: Date;

    // Filter logic
    switch (range) {
      case '1D':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case '1W':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '1M':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3M':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1Y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'ALL':
      default:
        startDate = new Date(0); // Beginning of time
    }

    if (range !== 'ALL') {
      query = query.gte('timestamp', startDate.toISOString());
    }

    const { data: rawData, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch history: ${error.message}`);
      throw error;
    }

    // Convert numeric strings to numbers and ensure strict ISO timestamps
    // Supabase returns numeric columns as strings to preserve precision
    const data =
      ((rawData as any[])?.map((row) => ({
        ...row,
        net_worth: Number(row.net_worth),
        total_cost: Number(row.total_cost),
        // Ensure timestamp is strictly ISO 8601 (replace space with T)
        timestamp: row.timestamp?.replace(' ', 'T'),
      })) as PortfolioSnapshotDto[]) || [];

    this.logger.debug(
      `Found ${data.length} snapshots for portfolio ${portfolioId} in range ${range}`,
    );

    return {
      data,
      meta: {
        range,
        count: data.length,
        staleness:
          data.length > 0
            ? (data[data.length - 1]?.timestamp ?? new Date().toISOString())
            : new Date().toISOString(),
      },
    };
  }

  /**
   * Capture snapshots for ALL portfolios (batch operation for scheduled jobs)
   * Returns immediately after starting the process (fire-and-forget pattern)
   */
  async captureAll(): Promise<{
    started: boolean;
    portfolioCount: number;
    message: string;
  }> {
    this.logger.log('Starting batch snapshot capture for all portfolios...');

    try {
      // 1. Get all portfolios (with their user_ids for RLS compliance)
      const { data: portfolios, error } = await this.supabase
        .from('portfolios')
        .select('id, user_id');

      if (error) {
        this.logger.error(`Failed to fetch portfolios: ${error.message}`);
        return {
          started: false,
          portfolioCount: 0,
          message: `Database error: ${error.message}`,
        };
      }

      if (!portfolios || portfolios.length === 0) {
        this.logger.log('No portfolios found for batch snapshot');
        return {
          started: true,
          portfolioCount: 0,
          message: 'No portfolios to snapshot',
        };
      }

      const portfolioCount = portfolios.length;
      this.logger.log(
        `Found ${portfolioCount} portfolios, starting snapshots...`,
      );

      // 2. Fire-and-forget: Process all portfolios asynchronously
      // We don't await to return immediately (avoiding Airflow timeouts)
      this.processAllSnapshots(portfolios);

      return {
        started: true,
        portfolioCount,
        message: `Batch snapshot started for ${portfolioCount} portfolios`,
      };
    } catch (error: any) {
      this.logger.error(
        `Error starting batch snapshots: ${error.message}`,
        error.stack,
      );
      return {
        started: false,
        portfolioCount: 0,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Internal method to process all portfolio snapshots
   * Runs in background (fire-and-forget)
   */
  private async processAllSnapshots(
    portfolios: { id: string; user_id: string }[],
  ): Promise<void> {
    let successCount = 0;
    let failCount = 0;
    const batchSize = 10; // Process 10 portfolios concurrently

    for (let i = 0; i < portfolios.length; i += batchSize) {
      const batch = portfolios.slice(i, i + batchSize);
      const promises = batch.map((portfolio) =>
        this.captureSnapshot(portfolio.user_id, portfolio.id, 'daily_job')
          .then((result) => {
            if (result) {
              successCount++;
            } else {
              failCount++;
            }
          })
          .catch((error) => {
            this.logger.error(
              `Batch snapshot failed for portfolio ${portfolio.id}: ${error.message}`,
            );
            failCount++;
          }),
      );

      await Promise.all(promises);
    }

    this.logger.log(
      `Batch snapshot complete: ${successCount} succeeded, ${failCount} failed out of ${portfolios.length} total`,
    );
  }
}
