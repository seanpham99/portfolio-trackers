import { Redis } from '@upstash/redis';
import { Injectable, Global, Module, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const UPSTASH_CLIENT = 'UPSTASH_CLIENT';

/**
 * Upstash Redis Cache Service
 * Implements write-through caching with explicit invalidation per Architecture Decision 1.3
 */
@Injectable()
export class CacheService {
  private readonly defaultTtl = 30; // 30 seconds as per PRD

  constructor(
    @Inject(UPSTASH_CLIENT)
    private readonly redis: Redis | null,
  ) {}

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a cached value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, value, { ex: ttlSeconds ?? this.defaultTtl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete a single cache key
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  /**
   * Invalidate all cache keys matching a pattern
   * Used for portfolio mutations per Decision 1.3
   * Pattern example: portfolio:{userId}:{portfolioId}:*
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    try {
      // Upstash doesn't support SCAN, so we use a workaround with KEYS
      // In production, consider using a prefix list approach
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  /**
   * Invalidate all portfolio-related cache keys for a user
   */
  async invalidatePortfolio(
    userId: string,
    portfolioId: string,
  ): Promise<void> {
    await this.invalidatePattern(`portfolio:${userId}:${portfolioId}:*`);
    await this.invalidatePattern(`holdings:${userId}:*`);
    await this.del(`portfolios:${userId}`);
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.redis !== null;
  }
}

/**
 * Global module providing Upstash Redis client
 * Gracefully handles missing configuration (cache disabled)
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: UPSTASH_CLIENT,
      useFactory: (configService: ConfigService): Redis | null => {
        const url = configService.get<string>('UPSTASH_REDIS_REST_URL');
        const token = configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

        if (!url || !token) {
          console.warn('Upstash Redis not configured - caching disabled');
          return null;
        }

        return new Redis({
          url,
          token,
        });
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [UPSTASH_CLIENT, CacheService],
})
export class CacheModule {}
