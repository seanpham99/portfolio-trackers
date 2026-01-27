import { Injectable, Global, Module, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis Cache Service (Self-hosted)
 * Implements write-through caching with explicit invalidation per Architecture Decision 1.3
 */
@Injectable()
export class CacheService {
  private readonly defaultTtl = 30; // 30 seconds as per PRD

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis | null,
  ) {}

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
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
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, stringValue, 'EX', this.defaultTtl);
      }
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
      // Use KEYS for simplicity in this migration, similar to previous logic.
      // For high-scale production, consider SCAN.
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
 * Global module providing Redis client
 * Gracefully handles missing configuration (cache disabled)
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis | null => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');

        if (!host || !port) {
          console.warn(
            'Redis not configured (REDIS_HOST/REDIS_PORT) - caching disabled',
          );
          return null;
        }

        const client = new Redis({
          host,
          port,
          lazyConnect: true, // Don't crash if Redis is down on startup
        });

        client.on('error', (err) => {
          // Suppress errors to allow app to run without Redis
          console.error('Redis connection error:', err.message);
        });

        return client;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class CacheModule {}
